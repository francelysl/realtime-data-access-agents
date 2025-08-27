from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SRTA Agents API"
    API_PREFIX: str = "/api/v1"
    ENV: str = "local"
    REDIS_URL: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()
