import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def _split_origins(raw_origins: str) -> list[str]:
    def _normalize(origin: str) -> str:
        # Browser Origin header never includes a trailing slash.
        return origin.strip().rstrip("/")

    origins = [_normalize(origin) for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["http://localhost:5173"]


@dataclass(frozen=True)
class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS: list[str] = field(
        default_factory=lambda: _split_origins(
            os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_URL", "http://localhost:5173"))
        )
    )
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    GREENHOUSE_BOARDS: list[str] = field(
        default_factory=lambda: [value.strip() for value in os.getenv("GREENHOUSE_BOARDS", "").split(",") if value.strip()]
    )
    LEVER_COMPANIES: list[str] = field(
        default_factory=lambda: [value.strip() for value in os.getenv("LEVER_COMPANIES", "").split(",") if value.strip()]
    )
    INGEST_ENABLE_REMOTIVE: bool = os.getenv("INGEST_ENABLE_REMOTIVE", "true").lower() == "true"
    INGEST_ENABLE_ARBEITNOW: bool = os.getenv("INGEST_ENABLE_ARBEITNOW", "true").lower() == "true"
    INGEST_ENABLE_REMOTEOK: bool = os.getenv("INGEST_ENABLE_REMOTEOK", "true").lower() == "true"
    INGEST_STUDENT_ONLY: bool = os.getenv("INGEST_STUDENT_ONLY", "true").lower() == "true"
    JOB_INGEST_TIMEOUT_SEC: int = int(os.getenv("JOB_INGEST_TIMEOUT_SEC", "15"))
    JOB_INGEST_MAX_PER_SOURCE: int = int(os.getenv("JOB_INGEST_MAX_PER_SOURCE", "120"))
    JOB_INGEST_TOKEN: str = os.getenv("JOB_INGEST_TOKEN", "")


settings = Settings()
