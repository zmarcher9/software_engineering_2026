from copy import deepcopy
from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

import database
import routes_transactions
from auth import AuthenticatedUser, get_current_supabase_user
from main import app

USER_ID = "10000000-0000-0000-0000-000000000001"
OTHER_USER_ID = "10000000-0000-0000-0000-000000000002"


class Result:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, rows, operation="select", payload=None):
        self.rows = rows
        self.operation = operation
        self.payload = payload
        self.filters = []
        self.descending = False

    def select(self, _columns):
        return self

    def insert(self, payload):
        self.operation, self.payload = "insert", payload
        return self

    def update(self, payload):
        self.operation, self.payload = "update", payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, field, value):
        self.filters.append((field, str(value)))
        return self

    def order(self, _field, desc=False):
        self.descending = desc
        return self

    def _matches(self, row):
        return all(str(row.get(field)) == value for field, value in self.filters)

    def execute(self):
        now = datetime.now(timezone.utc).isoformat()
        if self.operation == "insert":
            row = {
                "id": str(uuid4()),
                "created_at": now,
                "updated_at": now,
                **self.payload,
            }
            self.rows.append(row)
            return Result([deepcopy(row)])

        matching = [row for row in self.rows if self._matches(row)]
        if self.operation == "update":
            for row in matching:
                row.update(self.payload)
                row["updated_at"] = now
            return Result(deepcopy(matching))
        if self.operation == "delete":
            for row in matching:
                self.rows.remove(row)
            return Result(deepcopy(matching))

        matching.sort(
            key=lambda row: row["transaction_date"],
            reverse=self.descending,
        )
        return Result(deepcopy(matching))


class FakeSupabase:
    def __init__(self, rows):
        self.rows = rows

    def table(self, name):
        if name == "categories":
            return FakeQuery(
                [
                    {
                        "id": "20000000-0000-0000-0000-000000000001",
                        "user_id": USER_ID,
                        "name": "Shopping",
                        "transaction_date": "",
                    }
                ]
            )
        assert name == "transactions"
        return FakeQuery(self.rows)


class FakeAuth:
    def __init__(self, user_id=None, error=None):
        self.user_id = user_id
        self.error = error

    def get_user(self, token):
        assert token == "supabase-access-token"
        if self.error:
            raise self.error
        user = type("User", (), {"id": self.user_id, "email": "user@example.com"})()
        return type("AuthResponse", (), {"user": user})()


@pytest.fixture
def transaction_id():
    return UUID("30000000-0000-0000-0000-000000000001")


@pytest.fixture
def fake_supabase(transaction_id):
    now = "2026-07-01T12:00:00+00:00"
    rows = [
        {
            "id": str(transaction_id),
            "user_id": USER_ID,
            "category_id": None,
            "amount": "20.50",
            "transaction_type": "expense",
            "transaction_date": "2026-07-01",
            "note": "Lunch",
            "merchant": "Cafe",
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": "30000000-0000-0000-0000-000000000002",
            "user_id": OTHER_USER_ID,
            "category_id": None,
            "amount": "999.00",
            "transaction_type": "expense",
            "transaction_date": "2026-07-02",
            "note": None,
            "merchant": "Private",
            "created_at": now,
            "updated_at": now,
        },
    ]
    return FakeSupabase(rows)


@pytest.fixture
def client(monkeypatch, fake_supabase):
    app.dependency_overrides[get_current_supabase_user] = lambda: AuthenticatedUser(
        id=USER_ID,
        email="user@example.com",
        access_token="supabase-access-token",
    )
    monkeypatch.setattr(
        routes_transactions,
        "get_supabase_client",
        lambda access_token=None: fake_supabase,
    )
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_transactions_require_authentication():
    with TestClient(app) as unauthenticated_client:
        response = unauthenticated_client.get("/transactions")
    assert response.status_code == 401


def test_supabase_access_token_is_validated(monkeypatch):
    fake_client = type("Client", (), {"auth": FakeAuth(USER_ID)})()
    monkeypatch.setattr(database, "get_supabase_client", lambda access_token=None: fake_client)
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="supabase-access-token",
    )
    assert get_current_supabase_user(credentials).id == USER_ID


def test_invalid_supabase_access_token_is_rejected(monkeypatch):
    fake_client = type("Client", (), {"auth": FakeAuth(error=ValueError("expired"))})()
    monkeypatch.setattr(database, "get_supabase_client", lambda access_token=None: fake_client)
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="supabase-access-token",
    )
    with pytest.raises(HTTPException) as exc_info:
        get_current_supabase_user(credentials)
    assert exc_info.value.status_code == 401


def test_create_transaction(client):
    response = client.post(
        "/transactions",
        json={
            "amount": "42.75",
            "transaction_type": "expense",
            "transaction_date": "2026-07-20",
            "merchant": "Book Shop",
        },
    )
    assert response.status_code == 201
    assert response.json()["amount"] == "42.75"
    assert response.json()["user_id"] == USER_ID


def test_create_transaction_resolves_frontend_category_name(client):
    response = client.post(
        "/transactions",
        json={"amount": "15.00", "category": "Shopping"},
    )
    assert response.status_code == 201
    assert response.json()["category_id"] == "20000000-0000-0000-0000-000000000001"


def test_list_transactions_only_returns_current_users_rows(client):
    response = client.get("/transactions")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["merchant"] == "Cafe"


def test_get_transaction(client, transaction_id):
    response = client.get(f"/transactions/{transaction_id}")
    assert response.status_code == 200
    assert response.json()["note"] == "Lunch"


def test_update_transaction(client, transaction_id):
    response = client.put(
        f"/transactions/{transaction_id}",
        json={"amount": "25.00", "note": "Team lunch"},
    )
    assert response.status_code == 200
    assert response.json()["amount"] == "25.00"
    assert response.json()["note"] == "Team lunch"


def test_delete_transaction(client, transaction_id):
    response = client.delete(f"/transactions/{transaction_id}")
    assert response.status_code == 204
    assert client.get(f"/transactions/{transaction_id}").status_code == 404


def test_cannot_access_another_users_transaction(client):
    other_transaction_id = "30000000-0000-0000-0000-000000000002"
    assert client.get(f"/transactions/{other_transaction_id}").status_code == 404
    assert client.put(f"/transactions/{other_transaction_id}", json={"amount": 1}).status_code == 404
    assert client.delete(f"/transactions/{other_transaction_id}").status_code == 404


def test_rejects_invalid_amount(client):
    response = client.post("/transactions", json={"amount": 0})
    assert response.status_code == 422


def test_negative_amount_is_normalized_to_expense(client):
    response = client.post(
        "/transactions",
        json={"amount": "-12.50", "category": "Shopping", "transaction_type": "income"},
    )
    assert response.status_code == 201
    assert response.json()["amount"] == "12.50"
    assert response.json()["transaction_type"] == "expense"


def test_rejects_unexpected_fields(client):
    response = client.post("/transactions", json={"amount": 10, "unexpected": True})
    assert response.status_code == 422


def test_rejects_future_transaction_date(client):
    response = client.post(
        "/transactions",
        json={"amount": 10, "transaction_date": "2999-01-01"},
    )
    assert response.status_code == 422
