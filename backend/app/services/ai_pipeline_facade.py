import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.candidate import Candidate
from app.db.repositories.candidate_repo import CandidateRepository
from app.ai.extractors.factory import ExtractorFactory

class ResumePipelineFacade:
    """
    Facade Pattern: Orchestrates the complex resume processing steps.
    """
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.repo = CandidateRepository(db_session)

    async def process_new_resume(self, file_path: str, filename: str) -> Candidate:
        # Step 1: Create initial database entry
        candidate = await self.repo.create_candidate_entry(file_path, filename)

        # Step 2: Extract Raw Text using the Strategy Factory
        extractor = ExtractorFactory.get_extractor(file_path)
        raw_text = extractor.extract_text(file_path)

        # Step 3: Update database with raw text
        candidate.raw_text = raw_text
        self.db.add(candidate)
        await self.db.commit()
        await self.db.refresh(candidate)

        # Step 4: TODO -> NLP Skill Extraction (spaCy)
        # Step 5: TODO -> Semantic Scoring (Sentence Transformers)

        return candidate
