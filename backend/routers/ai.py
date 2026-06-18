from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import models, schemas, database
import google.generativeai as genai
import os
import json
from pydantic import BaseModel
import PyPDF2
import io

router = APIRouter(prefix="/ai", tags=["ai"])

from security import get_current_user

# Ensure API key is configured. In production this should come from settings
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class AIRequest(schemas.HistoryBase):
    prompt: str

class ResumeReviewRequest(BaseModel):
    resume_text: str
    job_description: str

from typing import List

class ChatMessage(BaseModel):
    role: str
    text: str

class MockInterviewRequest(BaseModel):
    job_title: str
    history: List[ChatMessage]
    message: str

@router.post("/recommend", response_model=schemas.HistoryResponse)
def get_recommendation(request: AIRequest, username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
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
        model = genai.GenerativeModel("gemini-2.5-flash")
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
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
        
        # Save to history
        new_history = models.History(
            username=username,
            education=request.education,
            skills=request.skills,
            interests=request.interests,
            goal=request.goal,
            response=roadmap_markdown,
            resources=json.dumps({"resources": resources_list, "tasks": tasks_list})
        )
        db.add(new_history)
        db.commit()
        db.refresh(new_history)
        
        return new_history
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{username}", response_model=list[schemas.HistoryResponse])
def get_history(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    history = db.query(models.History).filter(models.History.username == username).all()
    return history

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

@router.post("/resume-review/{username}")
async def review_resume(
    username: str,
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
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
        model = genai.GenerativeModel("gemini-2.5-flash")
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        response_text = response.text if response and response.text else "⚠️ No response generated."
        
        return {"review": response_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mock-interview")
def mock_interview(request: MockInterviewRequest, current_user: models.User = Depends(get_current_user)):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Convert our history schema to Gemini's format
        gemini_history = []
        for msg in request.history:
            # map role 'assistant' to 'model'
            role = "model" if msg.role == "assistant" else "user"
            gemini_history.append({"role": role, "parts": [msg.text]})
            
        system_instruction = f"""
        You are an expert Technical Interviewer for the role of '{request.job_title}'.
        Your job is to conduct a mock interview with the user.
        Rules:
        1. Ask ONE question at a time.
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class JobSearchRequest(BaseModel):
    target_role: str
    location: str
    education: str
    skills: str

@router.post("/jobs")
def get_jobs(request: JobSearchRequest, username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
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
    - "apply_url": (string) Just use "#"
    """
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt, generation_config={"temperature": 0.8, "max_output_tokens": 4096})
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="No response from Gemini")
            
        import re
        text = response.text
        match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        
        if match:
            return json.loads(match.group(1))
        else:
            # Try to parse raw text if markdown tags are missing
            return json.loads(text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

