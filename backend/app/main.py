from fastapi import FastAPI
from .settings import settings
from .routers import health

app = FastAPI(title=settings.APP_NAME)

app.include_router(health.router, prefix=settings.API_PREFIX)
