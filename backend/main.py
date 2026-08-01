import os
from dotenv import load_dotenv
load_dotenv(override=True)
load_dotenv("backend/.env", override=True)
load_dotenv("../.env", override=True)

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database
from security import get_current_user

app = FastAPI(title="CareerCrafter API")

# Setup CORS
allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=database.engine)

from fastapi.staticfiles import StaticFiles
from routers import auth, profile, ai, peers, tasks

# Mount uploads directory
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(ai.router)
app.include_router(peers.router)
app.include_router(tasks.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerCrafter API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(database.get_db)):
    total_users = db.query(models.User).count()
    verified_users = db.query(models.User).filter(models.User.is_verified == True).count()
    total_profiles = db.query(models.Profile).count()
    total_history = db.query(models.History).count()
    total_tasks = db.query(models.Task).count()
    
    users = db.query(models.User).all()
    user_list = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_verified": u.is_verified
        }
        for u in users
    ]
    
    return {
        "summary": {
            "total_users": total_users,
            "verified_users": verified_users,
            "total_profiles": total_profiles,
            "total_history_items": total_history,
            "total_tasks": total_tasks
        },
        "users": user_list
    }

import json

@app.get("/admin/users/detailed")
def get_detailed_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    detailed_list = []
    for u in users:
        p = db.query(models.Profile).filter(models.Profile.username == u.username).first()
        history_count = db.query(models.History).filter(models.History.username == u.username).count()
        tasks_count = db.query(models.Task).filter(models.Task.username == u.username).count()
        
        badges_count = 0
        if p and p.badges:
            try:
                b_list = json.loads(p.badges)
                badges_count = len(b_list)
            except Exception:
                badges_count = 0
                
        detailed_list.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_verified": u.is_verified,
            "full_name": p.full_name if p and p.full_name else u.username,
            "education": p.education if p and p.education else "N/A",
            "skills": [s.strip() for s in p.skills.split(",") if s.strip()] if p and p.skills else [],
            "interests": [i.strip() for i in p.interests.split(",") if i.strip()] if p and p.interests else [],
            "points": p.points if p and p.points else 0,
            "badges_count": badges_count,
            "history_count": history_count,
            "tasks_count": tasks_count,
            "profile_pic": p.profile_pic if p else None
        })
    return detailed_list

from pydantic import BaseModel

class AwardPointsRequest(BaseModel):
    points: int

@app.delete("/admin/users/{user_id}")
def delete_user_admin(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    username = target_user.username
    db.query(models.Profile).filter(models.Profile.username == username).delete()
    db.query(models.History).filter(models.History.username == username).delete()
    db.query(models.Task).filter(models.Task.username == username).delete()
    db.delete(target_user)
    db.commit()
    return {"success": True, "message": f"User {username} deleted successfully"}

@app.post("/admin/users/{user_id}/toggle-verify")
def toggle_verify_user_admin(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.is_verified = not target_user.is_verified
    db.commit()
    return {"success": True, "is_verified": target_user.is_verified}

@app.post("/admin/users/{user_id}/award-points")
def award_points_user_admin(user_id: int, request: AwardPointsRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_profile = db.query(models.Profile).filter(models.Profile.username == target_user.username).first()
    if target_profile:
        target_profile.points = (target_profile.points or 0) + request.points
        db.commit()
        return {"success": True, "points": target_profile.points}
    return {"success": False, "error": "Profile not found"}

from sqlalchemy import inspect

@app.get("/admin/schema")
def get_db_schema_admin():
    inspector = inspect(database.engine)
    schema_info = {}
    
    for table_name in inspector.get_table_names():
        columns = []
        for col in inspector.get_columns(table_name):
            columns.append({
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col["nullable"]
            })
        schema_info[table_name] = {
            "columns_count": len(columns),
            "columns": columns
        }
        
    return {
        "database_type": database.engine.name,
        "tables": schema_info
    }
