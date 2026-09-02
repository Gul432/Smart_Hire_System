from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.config import settings
from app.core.database import get_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint to ensure API and Database are connected.
    """
    try:
        # Simple query to check DB connection
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return {
        "status": "ok",
        "database": db_status,
        "project": settings.PROJECT_NAME
    }

# Entrypoint for running with Uvicorn (dev only)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
