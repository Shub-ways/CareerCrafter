import os
from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database

app = FastAPI(title="CareerCrafter API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
