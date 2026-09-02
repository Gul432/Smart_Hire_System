from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import os
import shutil

from app.core.database import get_db
from app.schemas.candidate import CandidateResponse
from app.services.ai_pipeline_facade import ResumePipelineFacade
from app.db.repositories.candidate_repo import CandidateRepository

router = APIRouter(prefix="/candidates", tags=["Candidates"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=CandidateResponse)
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload a PDF/DOCX resume. 
    Saves the file and extracts raw text using the AI Pipeline Facade.
    """
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save file to disk
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Process using the Facade
    facade = ResumePipelineFacade(db)
    candidate = await facade.process_new_resume(file_location, file.filename)
    
    return candidate

@router.get("/", response_model=List[CandidateResponse])
async def list_candidates(db: AsyncSession = Depends(get_db)):
    """Get a list of all candidates."""
    repo = CandidateRepository(db)
    return await repo.get_all_candidates()
