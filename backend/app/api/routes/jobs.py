from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schemas.job import JobCreate, JobResponse
from app.db.repositories.job_repo import JobRepository

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse)
async def create_job(job: JobCreate, db: AsyncSession = Depends(get_db)):
    """Create a new Job Description."""
    repo = JobRepository(db)
    new_job = await repo.create_job(job)
    return new_job

@router.get("/", response_model=List[JobResponse])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    """Get all Job Descriptions."""
    repo = JobRepository(db)
    jobs = await repo.get_all_jobs()
    return jobs
