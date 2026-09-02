from pydantic import BaseModel
from typing import List, Dict, Optional

class JobCreate(BaseModel):
    title: str
    industry_category: str
    description: str
    required_skills: List[str] = []
    scoring_weights: Dict[str, float] = {}

class JobResponse(JobCreate):
    id: int

    class Config:
        from_attributes = True
