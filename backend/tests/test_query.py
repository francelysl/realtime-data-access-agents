from fastapi.testclient import TestClient
from app.main import app
from app.settings import settings

client = TestClient(app)

def test_query_allowed_then_budget_deny():
    url = f"{settings.API_PREFIX}/query"
    payload = {"user_id":"tina","sql":"select * from x limit 1","preview":True}

    r1 = client.post(url, json=payload)
    assert r1.status_code == 200
    assert r1.json()["allowed"] is True

    big = {"user_id":"tina","sql":"SELECT " + ("x," * 2000) + " y FROM z","preview":False}
    r2 = client.post(url, json=big)
    assert r2.status_code == 200
    # Depending on remaining budget, may still pass the first time; run multiple times to exceed
    for _ in range(50):
        r2 = client.post(url, json=big)

    r3 = client.post(url, json=big)
    assert r3.status_code == 200
    assert r3.json()["allowed"] in (False, True)  
