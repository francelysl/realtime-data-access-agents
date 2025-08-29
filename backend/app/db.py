import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

PG_USER = os.getenv("POSTGRES_USER", "srta")
PG_PW = os.getenv("POSTGRES_PASSWORD", "srta_pw")
PG_DB = os.getenv("POSTGRES_DB", "srta")
PG_HOST = os.getenv("POSTGRES_HOST", "postgres")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")

DATABASE_URL = f"postgresql+psycopg://{PG_USER}:{PG_PW}@{PG_HOST}:{PG_PORT}/{PG_DB}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def get_session():
    return SessionLocal()
