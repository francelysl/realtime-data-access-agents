from fastapi import APIRouter, Response
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST

router = APIRouter(tags=["metrics"])

# Define counters
queries_total = Counter("queries_total", "Total queries received", ["status"])
rows_ingested = Counter("rows_ingested", "Total rows ingested into trades")

@router.get("/metrics")
def metrics():
    """Expose Prometheus metrics."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
