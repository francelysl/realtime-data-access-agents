from fastapi.testclient import TestClient
from app.main import app
from app.settings import settings

client = TestClient(app)

def test_health():
    r = client.get(f"{settings.API_PREFIX}/health")
    assert r.status_code == 200
    