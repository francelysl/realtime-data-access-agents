from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore" 
    )

    # App
    APP_NAME: str = "SRTA Agents API"
    API_PREFIX: str = "/api/v1"
    ENV: str = "local"

    # Cache
    REDIS_URL: str = "redis://redis:6379/0"

    # Query guardrails
    ALLOWED_TABLES: List[str] = ["trades"]
    PREVIEW_LIMIT: int = 50
    HARD_LIMIT: int = 1000

    # Agents
    ENABLE_AGENT: bool = False

settings = Settings()