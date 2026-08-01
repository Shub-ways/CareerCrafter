from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import models, schemas, database
import google.generativeai as genai
import os
import json
from pydantic import BaseModel
import PyPDF2
import io
import traceback
from typing import List

router = APIRouter(prefix="/ai", tags=["ai"])

from security import get_current_user

# Helper to retrieve API key dynamically
def get_api_key():
    from dotenv import load_dotenv
    load_dotenv(override=True)
    load_dotenv("backend/.env", override=True)
    load_dotenv("../.env", override=True)
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

def generate_content_with_fallback(prompt, generation_config=None):
    key = get_api_key()
    if not key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY (or GOOGLE_API_KEY) is not configured in .env file")
    genai.configure(api_key=key)
    
    candidate_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
    last_error = None
    
    for m_name in candidate_models:
        try:
            model = genai.GenerativeModel(m_name)
            if generation_config:
                res = model.generate_content(prompt, generation_config=generation_config)
            else:
                res = model.generate_content(prompt)
            if res and res.text:
                return res
        except Exception as err:
            last_error = err
            print(f"Model {m_name} failed generate_content: {err}")
            continue
            
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"Gemini AI Generation Error: {str(last_error)}")

def award_points_and_badges(username: str, db: Session, points_to_add: int, badge_title: str, badge_icon: str):
    try:
        profile = db.query(models.Profile).filter(models.Profile.username == username).first()
        if not profile:
            return
            
        profile.points = (profile.points or 0) + points_to_add
        
        current_badges = []
        if profile.badges:
            try:
                current_badges = json.loads(profile.badges)
            except Exception:
                current_badges = []
                
        existing_titles = [b.get("title") for b in current_badges if isinstance(b, dict)]
        if badge_title not in existing_titles:
            current_badges.append({
                "id": badge_title.lower().replace(" ", "_"),
                "title": badge_title,
                "icon": badge_icon,
                "earned_at": datetime.utcnow().strftime("%Y-%m-%d")
            })
            profile.badges = json.dumps(current_badges)
            
        db.commit()
    except Exception as e:
        print("Error awarding points/badges:", e)

class AIRequest(schemas.HistoryBase):
    prompt: str

class ResumeReviewRequest(BaseModel):
    resume_text: str
    job_description: str

from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    text: str

class MockInterviewRequest(BaseModel):
    job_title: str
    resume_text: Optional[str] = ""
    history: List[ChatMessage]
    message: str

@router.post("/recommend", response_model=schemas.HistoryResponse)
def get_recommendation(request: AIRequest, username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    full_prompt = f"""
    You are an AI Career Advisor. Based on the following user profile:

    🎓 Education: {request.education}
    🛠 Skills: {request.skills}
    💡 Interests: {request.interests}
    🏆 Career Goal: {request.goal}

    First, provide personalized career path recommendations in **Markdown format**.
    Make sure to include Recommended Career Paths, Skills to Learn, and Next Steps.

    Then, at the very end of your response, output a single JSON object enclosed in ```json and ```.
    The JSON object MUST have EXACTLY two keys: "resources" and "tasks".
    1. "resources": An array of objects. Each object MUST have:
       - "title": (string) Title of the course or resource
       - "platform": (string) e.g., Udemy, Coursera, YouTube
       - "description": (string) Brief 1-sentence description
       - "url": (string) A direct URL or search URL
    2. "tasks": An array of strings. Each string is a short, actionable task (e.g., "Learn React Context API"). Provide 5-10 tasks based on the roadmap.

    ----
    User Input: {request.prompt}
    """
    
    try:
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        response = generate_content_with_fallback(full_prompt, generation_config=generation_config)
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="No response from Gemini")
            
        import re
        text = response.text
        match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        
        resources_list = []
        tasks_list = []
        
        if match:
            try:
                parsed_json = json.loads(match.group(1))
                resources_list = parsed_json.get("resources", [])
                tasks_list = parsed_json.get("tasks", [])
            except Exception as e:
                print("Error parsing AI JSON:", e)
            roadmap_markdown = text.replace(match.group(0), "").strip()
        else:
            roadmap_markdown = text.strip()
        
        from datetime import datetime
        # Save to history
        new_history = models.History(
            username=username,
            education=request.education,
            skills=request.skills,
            interests=request.interests,
            goal=request.goal,
            response=roadmap_markdown,
            resources=json.dumps({"resources": resources_list, "tasks": tasks_list}),
            created_at=datetime.utcnow()
        )
        from datetime import datetime
        db.add(new_history)
        db.commit()
        db.refresh(new_history)
        
        award_points_and_badges(username, db, 30, "Career Pioneer", "🎓")
        
        return new_history
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{username}", response_model=list[schemas.HistoryResponse])
def get_history(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    history = db.query(models.History).filter(models.History.username == username).all()
    return history

@router.post("/parse-resume")
async def parse_resume(
    resume_file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if not (resume_file.filename.endswith('.pdf') or resume_file.filename.endswith('.txt')):
        raise HTTPException(status_code=400, detail="Only PDF or TXT files are supported")
        
    try:
        content = await resume_file.read()
        if resume_file.filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            extracted_text = ""
            for page in pdf_reader.pages:
                extracted_text += (page.extract_text() or "") + "\n"
        else:
            extracted_text = content.decode("utf-8", errors="ignore")
            
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the file. It might be scanned or empty.")
            
        return {"status": "success", "filename": resume_file.filename, "resume_text": extracted_text.strip()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading resume file: {str(e)}")

@router.delete("/history/{username}/{history_id}")
def delete_history(username: str, history_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    history_item = db.query(models.History).filter(models.History.id == history_id, models.History.username == username).first()
    if not history_item:
        raise HTTPException(status_code=404, detail="History not found")
        
    db.delete(history_item)
    db.commit()
    return {"status": "success", "message": "History deleted"}

@router.post("/resume-review")
@router.post("/resume-review/{username}")
async def review_resume(
    username: Optional[str] = None,
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if username and current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not resume_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        # Read the PDF file
        content = await resume_file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        resume_text = ""
        for page in pdf_reader.pages:
            resume_text += page.extract_text() + "\n"
            
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF. It might be scanned or empty.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")
        
    full_prompt = f"""
    You are an expert Technical Recruiter and ATS (Applicant Tracking System) software.
    Review the following resume against the provided target job description or career goal.

    Target Job / Goal:
    {job_description}

    Resume Text:
    {resume_text}

    Please provide a detailed, highly actionable critique in **Markdown format** containing:
    1. **ATS Match Score** (e.g., 75/100)
    2. **Missing Keywords** (crucial skills or terms missing from the resume)
    3. **Strengths** (what the resume does well)
    4. **Actionable Improvements** (bullet points on what exactly to change)
    """
    
    try:
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        response = generate_content_with_fallback(full_prompt, generation_config=generation_config)
        response_text = response.text if response and response.text else "⚠️ No response generated."
        
        # Save resume review result into user history
        target_username = current_user.username
        new_history = models.History(
            username=target_username,
            education="PDF Resume Upload",
            skills=resume_file.filename,
            interests="ATS Resume Optimization",
            goal=f"Resume Review: {job_description}",
            response=response_text,
            resources=json.dumps({"type": "resume_review", "filename": resume_file.filename, "job_description": job_description}),
            created_at=datetime.utcnow()
        )
        db.add(new_history)
        db.commit()
        db.refresh(new_history)
        
        award_points_and_badges(target_username, db, 50, "ATS Master", "📄")
        
        return {"review": response_text, "history_id": new_history.id}
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mock-interview")
def mock_interview(request: MockInterviewRequest, current_user: models.User = Depends(get_current_user)):
    try:
        key = get_api_key()
        if not key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        genai.configure(api_key=key)
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Convert our history schema to Gemini's format
        gemini_history = []
        for msg in request.history:
            role = "model" if msg.role == "assistant" else "user"
            gemini_history.append({"role": role, "parts": [msg.text]})
            
        resume_ctx = f"\n\nCandidate Resume / Skills / Background:\n{request.resume_text.strip()}" if request.resume_text and request.resume_text.strip() else ""
        system_instruction = f"""
        You are an expert Technical Interviewer for the role of '{request.job_title}'.{resume_ctx}
        Your job is to conduct a realistic, tailored mock interview with the candidate.
        Rules:
        1. Ask ONE question at a time. Tailor questions specifically to the candidate's resume/skills and target role.
        2. Wait for the user to answer.
        3. After the user answers, briefly evaluate their answer (praise good points, gently correct mistakes), and then immediately ask the next question.
        4. Keep your responses concise, conversational, and professional.
        5. Format your output in Markdown.
        """
        
        chat = model.start_chat(history=gemini_history)
        
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        if len(request.history) == 0:
            prompt = system_instruction + "\n\nUser: " + request.message
        else:
            prompt = request.message
            
        response = chat.send_message(prompt, generation_config=generation_config)
        response_text = response.text if response and response.text else "⚠️ No response generated."
        
        return {"reply": response_text}
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class MockEvaluateRequest(BaseModel):
    job_title: str
    resume_text: Optional[str] = ""
    history: List[ChatMessage]

@router.post("/mock-interview/evaluate")
def evaluate_mock_interview(request: MockEvaluateRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if len(request.history) < 2:
        raise HTTPException(status_code=400, detail="At least 1 Q&A exchange is required to generate feedback.")
        
    transcript = ""
    for msg in request.history:
        speaker = "Candidate" if msg.role == "user" else "Interviewer (AI)"
        transcript += f"**{speaker}**: {msg.text}\n\n"
        
    prompt = f"""
    You are an Executive Technical Recruiter evaluating a candidate's Mock Interview session.
    Target Position: {request.job_title}
    Candidate Resume/Background: {request.resume_text if request.resume_text else "Not provided"}

    Interview Transcript:
    {transcript}

    Evaluate performance across 3 metrics (scores between 0 and 100):
    1. Technical Knowledge & Accuracy
    2. Communication Clarity & Structure
    3. Problem Solving & Confidence

    Output MUST be a single JSON object enclosed in ```json and ```.
    The JSON object MUST have:
    - "overall_score": (integer 0-100)
    - "technical_score": (integer 0-100)
    - "communication_score": (integer 0-100)
    - "problem_solving_score": (integer 0-100)
    - "strengths": (array of 3 strings)
    - "improvements": (array of 3 strings)
    - "verdict": (string e.g., "Strong Hire", "Hire", "Needs Practice", "Re-evaluate")
    - "summary": (string) A 3-4 sentence constructive executive summary feedback.
    """
    
    try:
        response = generate_content_with_fallback(prompt, generation_config={"temperature": 0.5, "max_output_tokens": 4096})
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="No evaluation generated.")
            
        import re
        text = response.text
        match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        raw_json_str = match.group(1).strip() if match else text.strip()
        eval_data = json.loads(raw_json_str)
        
        # Save scorecard into history for persistence
        target_username = current_user.username
        from datetime import datetime
        new_history = models.History(
            username=target_username,
            education="Mock Interview Session",
            skills=f"Score: {eval_data.get('overall_score', 80)}/100 ({eval_data.get('verdict', 'Hire')})",
            interests="AI Mock Interview",
            goal=f"Mock Interview: {request.job_title}",
            response=f"### 🎙️ Mock Interview Scorecard - {request.job_title}\n\n**Verdict**: {eval_data.get('verdict', 'Hire')}\n**Overall Score**: {eval_data.get('overall_score', 80)}/100\n\n#### 📊 Score Breakdown:\n- **Technical Depth**: {eval_data.get('technical_score', 80)}/100\n- **Communication**: {eval_data.get('communication_score', 80)}/100\n- **Problem Solving**: {eval_data.get('problem_solving_score', 80)}/100\n\n#### 🌟 Strengths:\n" + "\n".join([f"- {s}" for s in eval_data.get('strengths', [])]) + "\n\n#### 🎯 Key Improvements:\n" + "\n".join([f"- {i}" for i in eval_data.get('improvements', [])]) + f"\n\n#### 📝 Executive Summary:\n{eval_data.get('summary', '')}",
            resources=json.dumps({"type": "mock_interview", "job_title": request.job_title, "eval": eval_data}),
            created_at=datetime.utcnow()
        )
        db.add(new_history)
        db.commit()
        db.refresh(new_history)
        
        award_points_and_badges(target_username, db, 100, "Interview Pro", "🎙️")
        
        return {"status": "success", "evaluation": eval_data, "history_id": new_history.id}
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Interview evaluation error: {str(e)}")

class JobSearchRequest(BaseModel):
    target_role: str
    location: str
    education: str
    skills: str

@router.post("/jobs")
def get_jobs(request: JobSearchRequest, username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    prompt = f"""
    You are an AI Job Board backend. Generate 5 highly realistic, simulated job postings tailored exactly to this candidate:
    Target Role: {request.target_role}
    Location: {request.location}
    Education: {request.education}
    Skills: {request.skills}

    Output MUST be a single JSON array containing 5 objects enclosed in ```json and ```.
    Each object MUST have:
    - "id": a unique random integer
    - "title": (string) Job Title
    - "company": (string) Realistic sounding company name
    - "location": (string) The location or "Remote"
    - "salary": (string) Realistic salary range
    - "match_score": (integer) A number between 75 and 99 representing how well the user's skills match
    - "description": (string) Brief 2-3 sentence job description
    - "requirements": (array of strings) 3-5 key skills required
    - "apply_url": (string) A direct LinkedIn Jobs or Indeed application link for this position (e.g., https://www.linkedin.com/jobs/search/?keywords=Data+Analyst)
    """
    
    try:
        response = generate_content_with_fallback(prompt, generation_config={"temperature": 0.8, "max_output_tokens": 4096})
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="No response from Gemini API")
            
        import re
        text = response.text
        match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        
        raw_json_str = match.group(1).strip() if match else text.strip()
        return json.loads(raw_json_str)
            
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gemini AI Job Search Error: {str(e)}")
