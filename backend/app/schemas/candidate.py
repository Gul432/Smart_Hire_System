from pydantic import BaseModel
from typing import List, Optional

class CandidateResponse(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    resume_file_path: str
    skills: List[str] = []
    
    class Config:
        from_attributes = True
