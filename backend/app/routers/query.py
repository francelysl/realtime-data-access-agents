from fastapi import APIRouter, HTTPException
from ..models.query import QueryRequest, QueryResponse

router = APIRouter(tags=["query"])

@router.post("/query", response_model=QueryResponse)
def run_query(_: QueryRequest):
    raise HTTPException(status_code=501, detail="Query execution not implemented yet")
