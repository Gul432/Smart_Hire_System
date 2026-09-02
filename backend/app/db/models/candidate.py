from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    
    resume_file_path = Column(String, nullable=False)
    raw_text = Column(Text, nullable=True)
    
    # Extracted data stored as JSONB for AI flexibility
    skills = Column(JSONB, default=list)
    education = Column(JSONB, default=list)
    experience = Column(JSONB, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"))
    
    match_score = Column(Float, nullable=False, default=0.0)
    score_breakdown = Column(JSONB, default=dict) # E.g. {"semantic_match": 80, "skill_match": 90}
    missing_skills = Column(JSONB, default=list)
    
    status = Column(String, default="pending") # pending, processing, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    candidate = relationship("Candidate")
    job = relationship("Job")
