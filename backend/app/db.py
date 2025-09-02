import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import NoSuchModuleError

DATABASE_URL = os.environ.get("SRTA_DB_URI", "sqlite+pysqlite:///./srta.db")

def _make_engine(url: str):
    return create_engine(url, pool_pre_ping=True, future=True)

try:
    engine = _make_engine(DATABASE_URL)
except NoSuchModuleError as e:
    # SQLAlchemy 1.4 doesn’t know "postgresql.psycopg"
    if "postgresql.psycopg" in str(e) and "postgresql+psycopg" in DATABASE_URL:
        fallback_url = DATABASE_URL.replace("postgresql+psycopg", "postgresql+psycopg2")
        engine = _make_engine(fallback_url)
    else:
        raise

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
