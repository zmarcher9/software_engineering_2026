from fastapi.testclient import TestClient

import routes_admin
from auth import AuthenticatedUser, get_current_supabase_user
from main import app

ADMIN_ID = "10000000-0000-0000-0000-000000000009"
USER_ID = "10000000-0000-0000-0000-000000000001"
OTHER_USER_ID = "10000000-0000-0000-0000-000000000002"


class Result:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = []

    def select(self, _columns):
        return self

    def eq(self, field, value):
        self.filters.append((field, str(value)))
        return self

    def _matches(self, row):
        return all(str(row.get(field)) == value for field, value in self.filters)

    def execute(self):
        return Result([row for row in self.rows if self._matches(row)])


class FakeSupabase:
    """Stands in for an RLS-scoped Postgres: an admin's client sees every
    row, a non-admin's client only ever sees rows tagged with their own id.
    That's what the categories_admin_select_all / transactions_admin_select_all
    policies (and the owner-only fallback) do in the real database.
    """

    def __init__(self, requester_id, users, categories, transactions):
        self.requester_id = requester_id
        self.users = users
        self.categories = categories
        self.transactions = transactions

    def table(self, name):
        is_admin = any(
            u["id"] == self.requester_id and u.get("is_admin") for u in self.users
        )
        if name == "users":
            # Every caller can read their own row; only admins can read every row.
            visible = self.users if is_admin else [
                u for u in self.users if u["id"] == self.requester_id
            ]
            return FakeQuery(visible)
        if name == "categories":
            visible = self.categories if is_admin else [
                c for c in self.categories if c["user_id"] == self.requester_id
            ]
            return FakeQuery(visible)
        assert name == "transactions"
        visible = self.transactions if is_admin else [
            t for t in self.transactions if t["user_id"] == self.requester_id
        ]
        return FakeQuery(visible)


def _seed():
    users = [
        {
            "id": ADMIN_ID,
            "email": "admin@example.com",
            "is_admin": True,
            "created_at": "2026-07-01T00:00:00+00:00",
        },
        {
            "id": USER_ID,
            "email": "user@example.com",
            "is_admin": False,
            "created_at": "2026-07-02T00:00:00+00:00",
        },
        {
            "id": OTHER_USER_ID,
            "email": "other@example.com",
            "is_admin": False,
            "created_at": "2026-07-03T00:00:00+00:00",
        },
    ]
    categories = [
        {"user_id": USER_ID},
        {"user_id": OTHER_USER_ID},
        {"user_id": OTHER_USER_ID},
    ]
    transactions = [
        {"user_id": USER_ID, "amount": "100.00", "transaction_type": "income"},
        {"user_id": USER_ID, "amount": "20.00", "transaction_type": "expense"},
        {"user_id": OTHER_USER_ID, "amount": "5.00", "transaction_type": "expense"},
    ]
    return users, categories, transactions


def _client_as(monkeypatch, user_id, email):
    users, categories, transactions = _seed()
    fake = FakeSupabase(user_id, users, categories, transactions)
    app.dependency_overrides[get_current_supabase_user] = lambda: AuthenticatedUser(
        id=user_id,
        email=email,
        access_token="supabase-access-token",
    )
    monkeypatch.setattr(routes_admin, "get_supabase_client", lambda access_token=None: fake)
    # get_current_admin_user imports get_supabase_client from database at call time.
    import database

    monkeypatch.setattr(database, "get_supabase_client", lambda access_token=None: fake)
    test_client = TestClient(app)
    return test_client


def teardown_function(_fn):
    app.dependency_overrides.clear()


def test_admin_users_requires_authentication():
    with TestClient(app) as unauthenticated_client:
        response = unauthenticated_client.get("/admin/users")
    assert response.status_code == 401


def test_non_admin_is_rejected(monkeypatch):
    client = _client_as(monkeypatch, USER_ID, "user@example.com")
    response = client.get("/admin/users")
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin privileges required"


def test_admin_sees_every_user_with_aggregates(monkeypatch):
    client = _client_as(monkeypatch, ADMIN_ID, "admin@example.com")
    response = client.get("/admin/users")
    assert response.status_code == 200

    body = {row["id"]: row for row in response.json()}
    assert set(body.keys()) == {ADMIN_ID, USER_ID, OTHER_USER_ID}

    target_user = body[USER_ID]
    assert target_user["transaction_count"] == 2
    assert target_user["total_income"] == "100.00"
    assert target_user["total_expenses"] == "20.00"
    assert target_user["category_count"] == 1

    other_user = body[OTHER_USER_ID]
    assert other_user["category_count"] == 2
    assert other_user["transaction_count"] == 1
