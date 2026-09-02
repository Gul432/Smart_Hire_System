from app.core.database import Base
from .user import User
from .job import Job
from .candidate import Candidate, AnalysisResult

# This file is strictly for Alembic to discover all models
# when importing `Base` for migrations.
