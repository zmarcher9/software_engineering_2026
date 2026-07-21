# Staging environment, CI gate, and preview deployments

This covers three pieces of infrastructure for FlowFunds:

1. A Railway **staging** environment, separate from production, with its own Supabase project/branch.
2. A required Pytest check on GitHub that blocks merging into `main` when the backend test suite fails.
3. Vercel preview deployments for every frontend PR.

All scripts referenced below live in `scripts/` at the repo root and are safe to re-run.

## 1. Staging environment

### 1a. Supabase (own project or branch)

Pick one:

- **Separate project (recommended, works on the free tier):**
  `./scripts/setup-supabase-staging.sh`
  Creates a new, fully isolated Supabase project (`flowfunds-staging`). You'll be prompted for an org ID, region, and a new DB password.

- **Persistent branch (requires Supabase Pro + branching compute):**
  `./scripts/setup-supabase-staging.sh --branch`
  Creates a persistent `staging` branch off the linked production project.

Either way, apply `server/migrations/001_initial_schema.sql` (and anything under `server/supabase/migrations`) to the new database, then copy its `SUPABASE_URL` / `SUPABASE_ANON_KEY` into `server/.env.staging` (see step 1b).

### 1b. Railway environment + env vars

```bash
cd server
cp .env.staging.example .env.staging   # fill in real values from step 1a
../scripts/setup-railway-staging.sh
```

This creates a `staging` Railway environment (separate from `production`, same project) and pushes the variables from `.env.staging` into it. Deploy it with:

```bash
railway up --environment staging
```

`.env.staging` is gitignored — never commit real credentials. `server/.env.staging.example` documents every variable, including `CORS_ORIGINS`/`CORS_ORIGIN_REGEX`, which `server/main.py` now reads at startup instead of the old hardcoded `localhost:5173` allowlist.

## 2. Pytest CI gate

`.github/workflows/ci.yml`'s `backend` job now always runs `pytest -v` — it no longer skips when tests are "missing." A real suite lives in `server/tests/` (12 tests covering the health endpoints and the register/login/me auth flow against an in-memory fake Supabase client, so it needs no network access or real credentials).

A green workflow run doesn't block merging by itself — that requires a branch protection rule with required status checks:

```bash
./scripts/setup-branch-protection.sh   # requires `gh auth login` with admin on the repo
```

This makes both `Backend (FastAPI)` and `Frontend (React + Vite)` required checks on `main`, so a failing Pytest run blocks the merge button.

Run the suite locally the same way CI does:

```bash
cd server
pip install -r requirements.txt -r requirements-dev.txt
pytest -v
```

Note: while wiring this up, `requirements.txt` picked up an explicit `bcrypt==4.0.1` pin — `passlib==1.7.4`'s bcrypt backend self-test crashes under `bcrypt>=4.1` (`AttributeError: module 'bcrypt' has no attribute '__about__'`, then a `ValueError` on its self-test string), which broke every register/login call before this pin. Worth verifying auth still works against a real deploy after upgrading either dependency in the future.

## 3. Vercel preview deployments

One-time manual step (dashboard-only, not scriptable for an existing project): in the Vercel project → **Settings → General → Root Directory**, set it to `client`. Without this, Vercel tries to build from the repo root and fails, since `client/` is a subdirectory of this monorepo.

Once that's set, Vercel's GitHub integration deploys a preview build automatically for every PR that touches `client/`. `client/vercel.json` now sets `ignoreCommand` so pushes that only touch `server/` don't trigger a wasted frontend build.

Point preview builds at the staging backend (rather than production) so PR testing never touches real data:

```bash
./scripts/setup-vercel-preview-env.sh https://<your-staging-service>.up.railway.app
```

Then add the resulting Vercel preview URL(s) to the staging backend's `CORS_ORIGINS` / `CORS_ORIGIN_REGEX` (`server/.env.staging`), since `server/main.py`'s CORS middleware only allows origins you explicitly configure.

## Summary of what changed

| File | Change |
|------|--------|
| `server/main.py` | CORS origins/regex now read from `CORS_ORIGINS` / `CORS_ORIGIN_REGEX` env vars instead of a hardcoded localhost allowlist |
| `server/requirements.txt` | Pinned `bcrypt==4.0.1` (fixes a real passlib/bcrypt incompatibility, caught by the new tests) |
| `server/requirements-dev.txt` | New — `pytest`, `pytest-mock` |
| `server/pytest.ini`, `server/conftest.py` | New — pytest config + import path setup |
| `server/tests/` | New — 12 tests: health checks, register/login/me, fake Supabase client |
| `server/.env.staging.example` | New — staging env var template |
| `server/railway.json` | Added healthcheck + restart policy |
| `.github/workflows/ci.yml` | Pytest now always runs (was conditional/skippable) |
| `client/vercel.json` | Added `ignoreCommand` scoped to `client/` |
| `scripts/setup-railway-staging.sh` | New |
| `scripts/setup-supabase-staging.sh` | New |
| `scripts/setup-branch-protection.sh` | New |
| `scripts/setup-vercel-preview-env.sh` | New |
