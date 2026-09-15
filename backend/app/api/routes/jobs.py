from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schemas.job import JobCreate, JobResponse
from app.db.repositories.job_repo import JobRepository
from app.services.ai_pipeline_facade import ResumePipelineFacade

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

@router.post("/{job_id}/score/{candidate_id}")
async def score_candidate_for_job(job_id: int, candidate_id: int, db: AsyncSession = Depends(get_db)):
    """
    Runs the Semantic Matcher and Industry Rules Engine to score a Candidate against a Job.
    Returns the final Match Percentage, Missing Skills, and Semantic Score.
    """
    facade = ResumePipelineFacade(db)
    try:
        analysis = await facade.score_candidate(candidate_id, job_id)
        return {
            "status": "success",
            "candidate_id": analysis.candidate_id,
            "job_id": analysis.job_id,
            "match_score_percentage": analysis.match_score,
            "score_breakdown": analysis.score_breakdown,
            "missing_skills": analysis.missing_skills
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
