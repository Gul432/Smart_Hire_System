from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import os
import shutil

from app.core.database import get_db
from app.schemas.candidate import CandidateResponse, BulkUploadResponse
from app.services.ai_pipeline_facade import ResumePipelineFacade
from app.db.repositories.candidate_repo import CandidateRepository
import uuid

router = APIRouter(prefix="/candidates", tags=["Candidates"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=CandidateResponse)
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload a single PDF/DOCX resume with UUID collision protection.
    """
    original_filename = os.path.basename(file.filename or "resume.pdf")
    unique_filename = f"{uuid.uuid4().hex[:8]}_{original_filename.replace(' ', '_')}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file to disk
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Process using the Facade
    facade = ResumePipelineFacade(db)
    candidate = await facade.process_new_resume(file_location, original_filename)
    
    return candidate

@router.post("/upload-bulk", response_model=BulkUploadResponse)
async def upload_bulk_resumes(files: List[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload multiple PDF/DOCX resumes (up to 50+ at once).
    Each file receives a unique UUID path to prevent collisions, and is processed independently.
    """
    facade = ResumePipelineFacade(db)
    successful_candidates = []
    errors = []
    
    for file in files:
        original_filename = os.path.basename(file.filename or "resume.pdf")
        unique_filename = f"{uuid.uuid4().hex[:8]}_{original_filename.replace(' ', '_')}"
        file_location = os.path.join(UPLOAD_DIR, unique_filename)
        
        try:
            # 1. Save file to disk with unique UUID name
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # 2. Process through AI Facade
            cand = await facade.process_new_resume(file_location, original_filename)
            successful_candidates.append(cand)
        except Exception as e:
            errors.append(f"Failed to process '{original_filename}': {str(e)}")
            
    return BulkUploadResponse(
        total=len(files),
        successful=len(successful_candidates),
        failed=len(errors),
        candidates=successful_candidates,
        errors=errors
    )

@router.get("/", response_model=List[CandidateResponse])
async def list_candidates(db: AsyncSession = Depends(get_db)):
    """Get a list of all candidates."""
    repo = CandidateRepository(db)
    return await repo.get_all_candidates()
