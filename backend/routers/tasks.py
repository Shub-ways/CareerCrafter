from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database
from security import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/{username}", response_model=list[schemas.TaskResponse])
def get_tasks(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Task).filter(models.Task.username == username).all()

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def toggle_task(task_id: int, is_completed: bool, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.username != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Gamification Logic
    if not task.is_completed and is_completed:
        # Task was completed just now -> +10 points
        profile = db.query(models.Profile).filter(models.Profile.username == current_user.username).first()
        if profile:
            profile.points = (profile.points or 0) + 10
            
    elif task.is_completed and not is_completed:
        # Task was un-completed -> -10 points
        profile = db.query(models.Profile).filter(models.Profile.username == current_user.username).first()
        if profile:
            profile.points = max(0, (profile.points or 0) - 10)

    task.is_completed = is_completed
    db.commit()
    db.refresh(task)
    return task

@router.post("/{username}", response_model=schemas.TaskResponse)
def add_task(username: str, task_in: schemas.TaskBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    new_task = models.Task(
        username=username,
        title=task_in.title,
        is_completed=task_in.is_completed
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.username != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(task)
    db.commit()
    return {"status": "success", "message": "Task deleted"}
