from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import os
import shutil

from app.core.database import get_db
from app.schemas.candidate import CandidateResponse
from app.db.repositories.candidate_repo import CandidateRepository

router = APIRouter(prefix="/candidates", tags=["Candidates"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=CandidateResponse)
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload a PDF/DOCX resume. 
    Currently, this saves the file and creates a database entry.
    Later, it will trigger the AI extraction pipeline.
    """
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save file to disk
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save entry to database
    repo = CandidateRepository(db)
    candidate = await repo.create_candidate_entry(file_location, file.filename)
    
    return candidate

@router.get("/", response_model=List[CandidateResponse])
async def list_candidates(db: AsyncSession = Depends(get_db)):
    """Get a list of all candidates."""
    repo = CandidateRepository(db)
    return await repo.get_all_candidates()
