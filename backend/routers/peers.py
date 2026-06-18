from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database

router = APIRouter(prefix="/peers", tags=["peers"])

from security import get_current_user

@router.get("/{username}", response_model=list[dict])
def get_peers(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    current_user_profile = db.query(models.Profile).filter(models.Profile.username == username).first()
    if not current_user_profile:
        return []
        
    all_profiles = db.query(models.Profile).filter(models.Profile.username != username).all()
    
    current_interests = set([i.strip() for i in current_user_profile.interests.split(",") if i.strip()])
    current_skills = set([s.strip() for s in current_user_profile.skills.split(",") if s.strip()])
    
    matches = []
    for profile in all_profiles:
        profile_interests = set([i.strip() for i in profile.interests.split(",") if i.strip()])
        profile_skills = set([s.strip() for s in profile.skills.split(",") if s.strip()])
        
        interests_overlap = current_interests & profile_interests
        skills_overlap = current_skills & profile_skills
        
        score = len(interests_overlap) * 2 + len(skills_overlap)
        
        if score > 0:
            matches.append({
                "username": profile.username,
                "full_name": profile.full_name,
                "profile_pic": profile.profile_pic,
                "linkedin_url": profile.linkedin_url,
                "github_url": profile.github_url,
                "interests_overlap": list(interests_overlap),
                "skills_overlap": list(skills_overlap),
                "score": score
            })
            
    # Sort by score descending
    matches = sorted(matches, key=lambda x: x["score"], reverse=True)
    return matches[:10] # Return top 10

from pydantic import BaseModel
class ConnectRequest(BaseModel):
    sender_username: str
    target_username: str

@router.post("/connect")
def connect_peers(request: ConnectRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != request.sender_username:
        raise HTTPException(status_code=403, detail="Not authorized to send as this user")
        
    sender_profile = db.query(models.Profile).filter(models.Profile.username == request.sender_username).first()
    target_profile = db.query(models.Profile).filter(models.Profile.username == request.target_username).first()
    
    sender_user = db.query(models.User).filter(models.User.username == request.sender_username).first()
    target_user = db.query(models.User).filter(models.User.username == request.target_username).first()
    
    if not sender_user or not target_user:
        return {"success": False, "error": "User not found"}
        
    import os
    import smtplib
    from email.message import EmailMessage
    
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user)
    
    if not smtp_user or not smtp_pass:
        return {"success": False, "error": "Email service not configured"}
        
    msg = EmailMessage()
    
    socials_text = ""
    if sender_profile.linkedin_url or sender_profile.github_url:
        socials_text = "\n\nYou can also check out their profiles:\n"
        if sender_profile.linkedin_url:
            socials_text += f"- LinkedIn: {sender_profile.linkedin_url}\n"
        if sender_profile.github_url:
            socials_text += f"- GitHub: {sender_profile.github_url}\n"
            
    msg_body = f"Hi {target_profile.full_name},\n\n{sender_profile.full_name} (@{sender_profile.username}) wants to connect with you on CareerCrafter!\n\nYou can reach out to them directly by replying to this email.{socials_text}\n\nBest,\nThe CareerCrafter Team"
    
    msg.set_content(msg_body)
    msg['Subject'] = f"New Connection Request from {sender_profile.full_name}"
    msg['From'] = smtp_from or "connections@careercrafter.local"
    # To both parties so they can reply all or reply to each other
    msg['To'] = target_user.email
    msg['Cc'] = sender_user.email
    msg.add_header('reply-to', sender_user.email)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user.strip(), smtp_pass.strip())
            server.send_message(msg)
        return {"success": True, "message": "Email introduction sent!"}
    except Exception as e:
        print(f"Error sending email: {e}")
        return {"success": False, "error": "Failed to send email"}
