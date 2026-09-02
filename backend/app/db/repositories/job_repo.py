from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models.job import Job
from app.schemas.job import JobCreate

class JobRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_job(self, job_data: JobCreate) -> Job:
        job = Job(**job_data.model_dump())
        self.session.add(job)
        await self.session.commit()
        await self.session.refresh(job)
        return job

    async def get_all_jobs(self):
        result = await self.session.execute(select(Job))
        return result.scalars().all()
