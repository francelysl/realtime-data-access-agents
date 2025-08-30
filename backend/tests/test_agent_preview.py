import os
from fastapi.testclient import TestClient
from app.main import app
from app.settings import settings

client = TestClient(app)

def test_agent_preview_limit_toggle(monkeypatch):
    monkeypatch.setenv("ENABLE_AGENT", "true")
    from importlib import reload
    from app import settings as settings_mod
    reload(settings_mod)
    s = settings_mod.settings

    url = f"{s.API_PREFIX}/query"
    payload = {
        "user_id": "agenttest",
        "sql": "select id, symbol from trades order by id desc",
        "preview": True
    }
    r = client.post(url, json=payload)
    assert r.status_code == 200
    j = r.json()
    assert j["allowed"] is True
    assert "Agent" in (j.get("agent_rationale") or "")
