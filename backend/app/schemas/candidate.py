from pydantic import BaseModel
from typing import List, Optional, Any

class CandidateResponse(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    resume_file_path: str
    skills: List[str] = []
    education: List[Any] = []
    experience: List[Any] = []
    
    class Config:
        from_attributes = True

class BulkUploadResponse(BaseModel):
    total: int
    successful: int
    failed: int
    candidates: List[CandidateResponse] = []
    errors: List[str] = []
