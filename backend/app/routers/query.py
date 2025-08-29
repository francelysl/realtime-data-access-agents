from fastapi import APIRouter
from ..models.query import QueryRequest, QueryResponse
from ..guardrails.budget import get_remaining, consume

router = APIRouter(tags=["query"])

def estimate_cost(sql: str, preview: bool) -> int:
    base = max(1, len(sql) // 10)
    return base + (5 if preview else 50)

def fake_execute(sql: str, preview: bool) -> list[dict]:
    row = {"ts": "2025-08-27T00:00:00Z", "value": 42, "sql": sql}
    return [row] if preview else [row] * 10

@router.post("/query", response_model=QueryResponse)
def run_query(req: QueryRequest):
    cost = estimate_cost(req.sql, req.preview)
    remaining = get_remaining(req.user_id)
    if cost > remaining:
        return QueryResponse(
            allowed=False,
            reason=f"Budget exceeded. Remaining={remaining}, cost={cost}",
        )

    new_remaining = consume(req.user_id, cost)
    data = fake_execute(req.sql, req.preview)
    return QueryResponse(
        allowed=True,
        reason=f"ok; remaining={new_remaining}",
        rows=len(data),
        data_preview=data[:10] if req.preview else data[:100]
    )
