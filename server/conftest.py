import os
import sys

# Make the top-level modules in server/ (main.py, database.py, auth.py,
# routes_auth.py) importable regardless of how pytest is invoked, since this
# package has no __init__.py / src layout.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Ensure tests never accidentally trip the "reject default JWT secret in
# production" guard in auth.py, and never depend on real Supabase creds.
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.pop("RAILWAY_ENVIRONMENT", None)
