import asyncio
from app.core.database import AsyncSessionLocal
from app.db.models.candidate import Candidate
from sqlalchemy.future import select

async def run():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Candidate))
        cands = res.scalars().all()
        print([{"id": c.id, "exp": c.experience, "edu": c.education} for c in cands])

if __name__ == "__main__":
    asyncio.run(run())
