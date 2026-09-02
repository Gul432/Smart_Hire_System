from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

# 1. Create the Database Engine (Singleton)
engine = create_async_engine(
    settings.ASYNC_DATABASE_URI,
    echo=True, # Logs SQL queries (disable in production)
    future=True
)

# 2. Create the Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# 3. Base class for SQLAlchemy Models
Base = declarative_base()

# Dependency for FastAPI to get a DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
