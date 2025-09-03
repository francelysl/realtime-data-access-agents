import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def _normalize_url(url: str) -> str:
    """
    Force psycopg v3 driver for any Postgres URL.
    Converts e.g. postgresql:// or postgresql+psycopg2:// -> postgresql+psycopg://
    """
    if not url:
        return url
    if url.startswith("postgresql+psycopg://"):
        return url
    if url.startswith("postgresql+psycopg2://"):
        return "postgresql+psycopg://" + url.split("://", 1)[1]
    if url.startswith("postgres://"):
        # handle old scheme
        return "postgresql+psycopg://" + url.split("://", 1)[1]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.split("://", 1)[1]
    return url

# Prefer SRTA_DB_URI; fall back to DATABASE_URL; then to a sane default (psycopg v3)
raw_url = os.getenv("SRTA_DB_URI") or os.getenv("DATABASE_URL") or \
          "postgresql+psycopg://srta:srta_pw@postgres:5432/srta"

DATABASE_URL = _normalize_url(raw_url)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def get_session():
    with SessionLocal() as session:
        yield session