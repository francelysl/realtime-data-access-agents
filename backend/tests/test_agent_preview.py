from importlib import reload
from fastapi.testclient import TestClient

def test_agent_preview_limit_toggle(monkeypatch):
    # 1) Set env before any imports that construct singletons
    monkeypatch.setenv("ENABLE_AGENT", "true")

    # 2) Reload modules in dependency order so everyone sees the new settings
    import app.settings as settings_mod
    reload(settings_mod)  

    import app.routers.query as query_mod
    reload(query_mod)    

    import app.main as main_mod
    reload(main_mod)     

    client = TestClient(main_mod.app)
    url = f"{settings_mod.settings.API_PREFIX}/query"

    payload = {
        "user_id": "agenttest",
        "sql": "select id, symbol from trades order by id desc",  # no LIMIT
        "preview": True
    }

    r = client.post(url, json=payload)
    assert r.status_code == 200
    j = r.json()
    assert j["allowed"] is True
    assert "Agent" in (j.get("agent_rationale") or ""), j
