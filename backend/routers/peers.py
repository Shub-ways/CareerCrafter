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
    
    current_interests_dict = {i.strip().lower(): i.strip() for i in (current_user_profile.interests or "").split(",") if i.strip()}
    current_skills_dict = {s.strip().lower(): s.strip() for s in (current_user_profile.skills or "").split(",") if s.strip()}
    
    matches = []
    for profile in all_profiles:
        profile_interests_dict = {i.strip().lower(): i.strip() for i in (profile.interests or "").split(",") if i.strip()}
        profile_skills_dict = {s.strip().lower(): s.strip() for s in (profile.skills or "").split(",") if s.strip()}
        
        shared_interest_keys = set(current_interests_dict.keys()) & set(profile_interests_dict.keys())
        shared_skill_keys = set(current_skills_dict.keys()) & set(profile_skills_dict.keys())
        
        interests_overlap = [current_interests_dict[k] for k in shared_interest_keys]
        skills_overlap = [current_skills_dict[k] for k in shared_skill_keys]
        
        score = len(interests_overlap) * 2 + len(skills_overlap)
        
        if score > 0:
            matches.append({
                "username": profile.username,
                "full_name": profile.full_name,
                "profile_pic": profile.profile_pic,
                "linkedin_url": profile.linkedin_url,
                "github_url": profile.github_url,
                "interests_overlap": interests_overlap,
                "skills_overlap": skills_overlap,
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
        
    from email_service import send_email
    from email_templates import get_peer_connect_email_html

    body_html = get_peer_connect_email_html(
        sender_name=sender_profile.full_name or sender_profile.username,
        sender_username=sender_profile.username,
        target_name=target_profile.full_name or target_profile.username,
        linkedin_url=sender_profile.linkedin_url,
        github_url=sender_profile.github_url
    )
    
    msg_body = f"Hi {target_profile.full_name},\n\n{sender_profile.full_name} (@{sender_profile.username}) wants to connect with you on CareerCrafter!\n\nYou can reach out to them directly by replying to this email."
    subject = f"New Connection Request from {sender_profile.full_name}"
    
    success = send_email(
        to_email=target_user.email,
        subject=subject,
        body_text=msg_body,
        body_html=body_html,
        reply_to=sender_user.email,
        cc_email=sender_user.email
    )
    
    if success:
        return {"success": True, "message": "Email introduction sent!"}
    else:
        return {"success": False, "error": "Failed to send email"}
