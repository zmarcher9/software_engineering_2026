from fastapi.testclient import TestClient


def test_root_health_check():
    import main

    with TestClient(main.app) as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_db_health_check_ok(monkeypatch):
    import main

    monkeypatch.setattr(
        main, "test_supabase_connection", lambda: {"status": "ok", "database": "connected"}
    )

    with TestClient(main.app) as client:
        response = client.get("/health/db")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_db_health_check_failure_surfaces_503(monkeypatch):
    import main
    from fastapi import HTTPException

    def _raise():
        raise HTTPException(status_code=503, detail="Supabase connection failed: boom")

    monkeypatch.setattr(main, "test_supabase_connection", _raise)

    with TestClient(main.app) as client:
        response = client.get("/health/db")

    assert response.status_code == 503
