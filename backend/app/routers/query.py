from fastapi import APIRouter
from sqlalchemy.orm import Session
from ..models.query import QueryRequest, QueryResponse
from ..guardrails.budget import get_remaining, consume
from ..settings import settings
from ..db import get_session
from ..repositories.query_repo import QueryRepo, UnsafeQueryError

router = APIRouter(tags=["query"])

def estimate_cost(sql: str, preview: bool) -> int:
    base = max(1, len(sql) // 10)
    return base + (5 if preview else 50)

@router.post("/query", response_model=QueryResponse)
def run_query(req: QueryRequest):
    # Budget check
    cost = estimate_cost(req.sql, req.preview)
    remaining = get_remaining(req.user_id)
    if cost > remaining:
        return QueryResponse(
            allowed=False,
            reason=f"Budget exceeded. Remaining={remaining}, cost={cost}",
        )

    # DB execution 
    try:
        db: Session = get_session()
        repo = QueryRepo(db)
        data = repo.preview(req.sql) if req.preview else repo.run(req.sql)
    except UnsafeQueryError as e:
        return QueryResponse(allowed=False, reason=f"Policy: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass

    # Budget is consumed only on success
    new_remaining = consume(req.user_id, cost)
    return QueryResponse(
        allowed=True,
        reason=f"ok; remaining={new_remaining}",
        rows=len(data),
        data_preview=data[:10] if req.preview else data[:100],
    )
