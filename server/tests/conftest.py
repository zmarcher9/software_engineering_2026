import pytest
from fastapi.testclient import TestClient

from tests.fake_supabase import FakeSupabaseClient


@pytest.fixture
def fake_supabase(monkeypatch):
    """Swap the real Supabase client used by the auth routes for an
    in-memory fake, so tests don't hit the network or a real project."""
    client = FakeSupabaseClient()
    monkeypatch.setattr("routes_auth.get_supabase_client", lambda: client)
    return client


@pytest.fixture
def api_client(fake_supabase):
    import main

    with TestClient(main.app) as test_client:
        yield test_client
