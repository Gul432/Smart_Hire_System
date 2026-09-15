import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.candidate import Candidate
from app.db.repositories.candidate_repo import CandidateRepository
from app.ai.extractors.factory import ExtractorFactory
from app.ai.nlp.ner import ResumeParser

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

        # Step 3: Extract structured data using spaCy NER
        parser = ResumeParser()
        extracted_data = parser.extract_entities(raw_text)
        
        # Step 4: Update database with text and skills
        candidate.raw_text = raw_text
        candidate.skills = extracted_data["skills"]
        
        # Deep Extraction Additions
        candidate.education = extracted_data.get("education", [])
        candidate.experience = extracted_data.get("experience", [])
        
        # Optionally update email if found
        if extracted_data.get("emails"):
            candidate.email = extracted_data["emails"][0]

        self.db.add(candidate)
        await self.db.commit()
        await self.db.refresh(candidate)

        # Step 5 is now handled separately via `score_candidate`
        return candidate

    async def score_candidate(self, candidate_id: int, job_id: int):
        from sqlalchemy.future import select
        from app.db.models.job import Job
        from app.db.models.candidate import AnalysisResult
        from app.ai.scoring.semantic import SemanticMatcher
        from app.ai.scoring.industry_rules import IndustryScorer

        # Fetch Candidate and Job
        cand = await self.db.get(Candidate, candidate_id)
        job = await self.db.get(Job, job_id)
        if not cand or not job:
            raise ValueError("Candidate or Job not found.")

        # 1. Semantic Score
        sem_score = SemanticMatcher.calculate_similarity(cand.raw_text or "", job.description or "")

        # 2. Industry Rules Score
        results = IndustryScorer.calculate_final_score(job, cand, sem_score)

        # 3. Save to Database
        analysis = AnalysisResult(
            candidate_id=cand.id,
            job_id=job.id,
            match_score=results["final_score"],
            score_breakdown={
                "semantic_score": results["semantic_score"],
                "skill_score": results["skill_score"]
            },
            missing_skills=results["missing_skills"],
            status="completed"
        )
        self.db.add(analysis)
        await self.db.commit()
        await self.db.refresh(analysis)
        
        return analysis
