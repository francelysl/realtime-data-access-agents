from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "SRTA Agents API"
    API_PREFIX: str = "/api/v1"
    ENV: str = "local"
    REDIS_URL: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"

## DB Guardrails
    ALLOWED_TABLES: List[str] = ["trades"] 
    PREVIEW_LIMIT: int = 50
    HARD_LIMIT: int = 1000  # absolute cap

    ENABLE_AGENT: bool = False

settings = Settings()
