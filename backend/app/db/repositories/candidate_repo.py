from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models.candidate import Candidate
import os

class CandidateRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_candidate_entry(self, file_path: str, filename: str) -> Candidate:
        # For now, we just save the file path. Extraction will happen later in the AI pipeline.
        candidate = Candidate(
            name=filename, # Temporary, will be updated by spaCy NER later
            resume_file_path=file_path
        )
        self.session.add(candidate)
        await self.session.commit()
        await self.session.refresh(candidate)
        return candidate
        
    async def get_all_candidates(self):
        result = await self.session.execute(select(Candidate))
        return result.scalars().all()
