from fastapi import APIRouter
from sqlalchemy.orm import Session
from ..models.query import QueryRequest, QueryResponse
from ..guardrails.budget import get_remaining, consume
from ..settings import settings
from ..db import get_session
from ..repositories.query_repo import QueryRepo, UnsafeQueryError
from ..agents.query_agent import suggest_rewrite 

router = APIRouter(tags=["query"])

def estimate_cost(sql: str, preview: bool) -> int:
    base = max(1, len(sql) // 10)
    return base + (5 if preview else 50)

@router.post("/query", response_model=QueryResponse)
def run_query(req: QueryRequest):
    used_sql = req.sql
    agent_note = None
    if settings.ENABLE_AGENT:
        suggestion = suggest_rewrite(req.sql, preview=req.preview)
        if suggestion.rewritten_sql:
            used_sql = suggestion.rewritten_sql
        agent_note = suggestion.rationale

    # Budget check 
    cost = estimate_cost(used_sql, req.preview)
    remaining = get_remaining(req.user_id)
    if cost > remaining:
        return QueryResponse(
            allowed=False,
            reason=f"Budget exceeded. Remaining={remaining}, cost={cost}",
            agent_rationale=agent_note
        )

    # DB execution (safe)
    try:
        db: Session = get_session()
        repo = QueryRepo(db)
        data = repo.preview(used_sql) if req.preview else repo.run(used_sql)
    except UnsafeQueryError as e:
        return QueryResponse(allowed=False, reason=f"Policy: {e}", agent_rationale=agent_note)
    finally:
        try:
            db.close()
        except Exception:
            pass

    # Consume budget after success
    new_remaining = consume(req.user_id, cost)
    return QueryResponse(
        allowed=True,
        reason=f"ok; remaining={new_remaining}",
        rows=len(data),
        data_preview=data[:10] if req.preview else data[:100],
        agent_rationale=agent_note
    )
