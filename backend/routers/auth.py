from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import hashlib
import random
import smtplib
from email.message import EmailMessage
import os
from datetime import datetime, timedelta
import models, schemas, database

router = APIRouter(prefix="/auth", tags=["auth"])

from security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

from email_service import send_email

def send_otp_email(to_email: str, otp: str):
    # Log the OTP to the console so that it can be retrieved from logs if email ports are blocked
    print(f"\n==========================================")
    print(f"[OTP Verification] To: {to_email} | OTP: {otp}")
    print(f"==========================================\n")

    body_text = f"Your CareerCrafter OTP is: {otp}\nIt is valid for 10 minutes."
    body_html = f"<p>Your CareerCrafter OTP is: <strong>{otp}</strong></p><p>It is valid for 10 minutes.</p>"
    
    return send_email(
        to_email=to_email,
        subject="Verify your CareerCrafter account",
        body_text=body_text,
        body_html=body_html
    )



@router.post("/request-otp")
def request_otp(request: schemas.OTPRequest, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == request.username).first()
    db_email = db.query(models.User).filter(models.User.email == request.email).first()
    
    if db_user and db_user.is_verified:
        raise HTTPException(status_code=400, detail="Username already registered")
    if db_email and db_email.is_verified:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=10)
    
    if db_user:
        db_user.email = request.email
        db_user.otp_code = otp
        db_user.otp_expiry = expiry
    else:
        new_user = models.User(
            username=request.username,
            email=request.email,
            hashed_password="",
            is_verified=False,
            otp_code=otp,
            otp_expiry=expiry
        )
        db.add(new_user)
        
    db.commit()
    
    send_otp_email(request.email, otp)
    
    return {"message": "OTP sent to email"}

@router.post("/verify-otp")
def verify_otp(request: schemas.OTPVerify, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == request.username).first()
    
    if not db_user or db_user.is_verified:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if db_user.email != request.email:
        raise HTTPException(status_code=400, detail="Email mismatch")
        
    if db_user.otp_code != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if db_user.otp_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    db_user.is_verified = True
    db_user.hashed_password = get_password_hash(request.password)
    db.commit()
    
    new_profile = models.Profile(
        username=db_user.username,
        full_name=db_user.username,
        age=18,
        education="Undergraduate",
        interests="",
        skills="",
        profile_pic=None
    )
    db.add(new_profile)
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
        
    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user or not db_user.is_verified:
        # We return a generic message to prevent email enumeration
        return {"message": "If that email is registered, an OTP has been sent."}
        
    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=10)
    
    db_user.otp_code = otp
    db_user.otp_expiry = expiry
    db.commit()
    
    send_otp_email(request.email, otp)
    return {"message": "If that email is registered, an OTP has been sent."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not db_user or not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    if db_user.otp_code != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if db_user.otp_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    db_user.hashed_password = get_password_hash(request.new_password)
    # Invalidate the OTP after use
    db_user.otp_code = None 
    db.commit()
    
    return {"message": "Password has been reset successfully"}
