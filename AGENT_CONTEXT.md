# FlowFunds — Agent Context Handoff

Use this file to onboard a new Cursor agent session. Read it before making changes.

## Project

**FlowFunds** — personal finance app for Spring 2026 Software Engineering.

Tagline: *Know where your money goes. Get alerts before it's gone.*

- **GitHub:** https://github.com/zmarcher9/software_engineering_2026
- **Local path:** `C:\Users\arche\Projects\software_engineering_2026`
- **Course:** Software Engineering 2026 (team project)

## What FlowFunds Does (SRS summary)

Users manually log transactions, set monthly category budgets, view a spending dashboard, and receive alerts at 80%/100% of budget plus forecast-based warnings. Admins manage users and view aggregate metrics.

### Planned roles

| Role | Capabilities |
|------|----------------|
| Guest | Register, log in, view landing page |
| Registered user | Transactions, budgets, dashboard, alerts, forecasts, weekly email digest, profile |
| Admin | Manage/suspend/delete users, system usage metrics |

### Planned database schema (not created yet)

- `users` — id, email, username, password_hash, created_at
- `categories` — id, user_id, name, color
- `budgets` — id, user_id, category_id, monthly_limit, month
- `transactions` — id, user_id, category_id, amount, date, note
- `alerts` — id, user_id, budget_id, type (80% \| 100% \| forecast), triggered_at, seen

**Note:** Database tables are intentionally deferred — another teammate ("Person 2") owns schema/migrations.

## Tech stack (agreed)

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS, Recharts (Recharts not installed yet) |
| Backend | Python, FastAPI, uvicorn |
| Database | PostgreSQL via Supabase |
| Email | FastAPI + SMTP (planned) |
| Hosting | Vercel (frontend `/client`), Railway or Render (backend `/server`) — **not deployed yet** |

## Repository structure

```
software_engineering_2026/
├── client/                 # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.jsx         # Placeholder landing page (dark theme, emerald accent)
│   │   ├── main.jsx
│   │   └── index.css       # Tailwind directives
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── server/                 # FastAPI backend
│   ├── main.py             # GET / health, GET /health/db Supabase test
│   ├── database.py         # Supabase client + connection test
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env                # User-created, gitignored — do not commit
│   └── venv/               # Python virtualenv (gitignored)
├── README.md
├── .gitignore
└── AGENT_CONTEXT.md        # This file
```

## What is DONE

- [x] React + Vite + Tailwind client scaffold with placeholder homepage
- [x] FastAPI backend with health check route
- [x] Supabase client wiring in `server/database.py`
- [x] `GET /` → `{"status": "ok"}`
- [x] `GET /health/db` → tests Supabase via auth health endpoint
- [x] CORS configured for `http://localhost:5173`
- [x] Root README with setup instructions
- [x] Backend venv created and dependencies installed (user machine)
- [x] Backend confirmed running: `uvicorn main:app --reload` on http://127.0.0.1:8000

## What is NOT done yet

- [ ] Push/sync all scaffold files to GitHub (may be partial or pending)
- [ ] Confirm `GET /health/db` with real Supabase credentials in `server/.env`
- [ ] Frontend `npm install` — may need SSL workaround on school Wi-Fi (see below)
- [ ] Database tables / migrations (Person 2)
- [ ] Auth (register, login, sessions)
- [ ] Transaction CRUD, budgets, dashboard, alerts, forecast engine
- [ ] Weekly digest email
- [ ] Admin panel
- [ ] Deployment (Step 4 — explicitly skipped for now)
- [ ] Recharts integration
- [ ] Unit tests for auth, alerts, forecast

## How to run locally

### Backend

```powershell
cd C:\Users\arche\Projects\software_engineering_2026\server
.\venv\Scripts\activate
uvicorn main:app --reload
```

- API: http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs
- DB test: http://127.0.0.1:8000/health/db

### Frontend

```powershell
cd C:\Users\arche\Projects\software_engineering_2026\client
npm.cmd install
npm.cmd run dev
```

- App: http://localhost:5173

## Windows / environment gotchas (important)

This dev machine is **Windows 10/11 with PowerShell**.

1. **PowerShell execution policy** blocks `npm.ps1`. Use `npm.cmd` instead of `npm`, or run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **School/corporate Wi-Fi SSL errors** during `npm install`:
   ```
   UNABLE_TO_VERIFY_LEAF_SIGNATURE
   unable to verify the first certificate
   ```
   Workarounds tried:
   ```powershell
   $env:NODE_OPTIONS="--use-system-ca"
   npm.cmd install
   ```
   Or temporary dev-only fix:
   ```powershell
   npm.cmd config set strict-ssl false
   ```

3. **Node.js** installed via `winget install OpenJS.NodeJS.LTS --source winget` (v24.18.0). After install, open a **new terminal** so PATH updates.

4. **Never commit** `server/.env`, `node_modules/`, or `server/venv/`.

## Environment variables

Copy `server/.env.example` → `server/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

User will fill these in manually from their Supabase project dashboard.

## Key architectural decisions (from SRS)

- Budget threshold alerts computed **server-side** when transactions are saved (not client-side)
- End-of-month forecast computed **on demand** from transactions (not stored)
- Passwords must be salted/hashed; sessions expire after 30 min inactivity
- Secrets in environment variables only

## Open design questions (unresolved)

1. **Supabase Auth vs custom auth** — SRS mentions both Supabase auth and a custom `users.password_hash` table. Team needs to pick one approach.
2. **Admin role** — no `role` column on users yet.
3. **Default categories** — seed on signup vs shared system categories?
4. **Weekly digest scheduler** — not chosen yet (Railway cron, Celery, etc.).

## Instructions for the next agent

1. **Read this file and `README.md` first.**
2. **Do not recreate** the client/server scaffold unless files are missing.
3. **Do not deploy** unless the user explicitly asks (deployment was deferred).
4. **Do not create database tables** unless the user asks — that may be Person 2's task.
5. **Ask before committing/pushing** to GitHub unless explicitly requested.
6. When working on this repo, workspace root should be:
   `C:\Users\arche\Projects\software_engineering_2026`

## Suggested next tasks (when user is ready)

1. Verify frontend runs after `npm.cmd install`
2. Confirm Supabase connection via `/health/db`
3. Push scaffold to GitHub if not already synced
4. Begin auth or database schema (coordinate with team)
