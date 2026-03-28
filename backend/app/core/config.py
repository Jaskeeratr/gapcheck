import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()