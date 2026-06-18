from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, database
import json

router = APIRouter(prefix="/profiles", tags=["profiles"])

from security import get_current_user

@router.get("/{username}", response_model=schemas.ProfileResponse)
def get_profile(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    profile = db.query(models.Profile).filter(models.Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # Convert string back to list
    interests_list = [i.strip() for i in profile.interests.split(",")] if profile.interests else []
    skills_list = [s.strip() for s in profile.skills.split(",")] if profile.skills else []
    
    return schemas.ProfileResponse(
        full_name=profile.full_name,
        age=profile.age,
        education=profile.education,
        interests=interests_list,
        skills=skills_list,
        profile_pic=profile.profile_pic,
        gender=profile.gender,
        points=profile.points,
        badges=profile.badges,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        username=profile.username
    )

@router.put("/{username}", response_model=schemas.ProfileResponse)
def update_profile(username: str, profile_update: schemas.ProfileUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
    profile = db.query(models.Profile).filter(models.Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile.full_name = profile_update.full_name
    profile.age = profile_update.age
    profile.education = profile_update.education
    profile.interests = ",".join(profile_update.interests)
    profile.skills = ",".join(profile_update.skills)
    profile.gender = profile_update.gender
    profile.linkedin_url = profile_update.linkedin_url
    profile.github_url = profile_update.github_url
    
    db.commit()
    db.refresh(profile)
    
    return get_profile(username, db)

import os
from fastapi import UploadFile, File
import shutil

@router.post("/{username}/avatar")
async def upload_avatar(username: str, file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
    profile = db.query(models.Profile).filter(models.Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # Create unique filename
    ext = file.filename.split('.')[-1]
    filename = f"{username}_avatar.{ext}"
    file_path = os.path.join("uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save URL to profile (assuming backend runs on localhost:8000, 
    # but storing relative path is safer, frontend can prepend backend URL)
    profile.profile_pic = f"/uploads/{filename}"
    db.commit()
    db.refresh(profile)
    
    
    return {"status": "success", "profile_pic": profile.profile_pic}

@router.delete("/{username}/avatar")
async def delete_avatar(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
    profile = db.query(models.Profile).filter(models.Profile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile.profile_pic = None
    db.commit()
    db.refresh(profile)
    
    return {"status": "success", "message": "Avatar removed"}
