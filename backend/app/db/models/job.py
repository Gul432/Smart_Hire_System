from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    industry_category = Column(String, nullable=False) # e.g., 'Software', 'Healthcare'
    description = Column(Text, nullable=False)
    
    # Store dynamic rules and requirements in JSONB for flexibility
    required_skills = Column(JSONB, default=list)
    scoring_weights = Column(JSONB, default=dict) # e.g., {"skills": 0.5, "experience": 0.3}
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
