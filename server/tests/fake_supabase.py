"""A minimal in-memory stand-in for the Supabase Python client's chainable
table query API, just enough to exercise routes_auth.py without a network
call or real database.
"""
from types import SimpleNamespace


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

    def table(self, name):
        rows = self._store.setdefault(name, [])
        return _FakeQuery(rows, name, self._store)
