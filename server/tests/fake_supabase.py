"""A minimal in-memory stand-in for the Supabase Python client's chainable
table query API, just enough to exercise routes_auth.py without a network
call or real database.
"""
from types import SimpleNamespace
from uuid import uuid4


class _FakeQuery:
    def __init__(self, rows, table_name, store):
        self._rows = rows
        self._table_name = table_name
        self._store = store
        self._filters = {}
        self._pending_insert = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, column, value):
        self._filters[column] = value
        return self

    def order(self, *_args, **_kwargs):
        return self

    def insert(self, payload):
        self._pending_insert = payload
        return self

    def execute(self):
        if self._pending_insert is not None:
            row = {"id": str(len(self._rows) + 1), **self._pending_insert}
            self._rows.append(row)
            return SimpleNamespace(data=[row])

        matched = [
            row for row in self._rows
            if all(row.get(k) == v for k, v in self._filters.items())
        ]
        return SimpleNamespace(data=matched)


class FakeSupabaseClient:
    """Usage: client.table("users").select("id").eq("email", x).execute()"""

    def __init__(self):
        self._store: dict[str, list[dict]] = {}
        self.auth = _FakeAuth()

    def table(self, name):
        rows = self._store.setdefault(name, [])
        return _FakeQuery(rows, name, self._store)


class _FakeAuth:
    def __init__(self):
        self._users = {}
        self._tokens = {}

    def _response(self, user, token):
        session = SimpleNamespace(access_token=token) if token else None
        return SimpleNamespace(user=user, session=session)

    def sign_up(self, credentials):
        email = credentials["email"]
        if email in self._users:
            raise ValueError("User already registered")
        user = SimpleNamespace(id=str(uuid4()), email=email)
        token = f"supabase-token-{user.id}"
        self._users[email] = (user, credentials["password"])
        self._tokens[token] = user
        return self._response(user, token)

    def sign_in_with_password(self, credentials):
        record = self._users.get(credentials["email"])
        if record is None or record[1] != credentials["password"]:
            raise ValueError("Invalid login credentials")
        user = record[0]
        token = f"supabase-token-{user.id}"
        self._tokens[token] = user
        return self._response(user, token)

    def get_user(self, token):
        user = self._tokens.get(token)
        if user is None:
            raise ValueError("Invalid JWT")
        return SimpleNamespace(user=user)
