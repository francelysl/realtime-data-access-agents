from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_session
from ..repositories.query_repo import QueryRepo
from app.schemas.base import QueryRequest, QueryResponse
from ..settings import settings

router = APIRouter(tags=["query"])

@router.post("/query", response_model=QueryResponse)
def run_query(req: QueryRequest, db: Session = Depends(get_session)):
    repo = QueryRepo(db)
    used_sql = req.sql

    # (whatever agent logic you already have)
    if settings.ENABLE_AGENT and req.preview:
        used_sql = repo.agent.apply_preview_limit(used_sql) if hasattr(repo, "agent") else used_sql

    data = repo.preview(used_sql) if req.preview else repo.run(used_sql)
    return {"data": data, "rationale": repo.agent_rationale if hasattr(repo, "agent_rationale") else None}

def estimate_cost(sql: str, preview: bool) -> int:
    base = max(1, len(sql) // 10)
    return base + (5 if preview else 50)
