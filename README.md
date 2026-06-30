# FlowFunds

**Know where your money goes. Get alerts before it's gone.**

FlowFunds is a personal finance web app for Spring 2026 (Software Engineering). Users log transactions, set category budgets, view spending dashboards, and receive alerts before they overspend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | Python, FastAPI |
| Database | PostgreSQL via Supabase |
| Email | FastAPI + SMTP (planned) |
| Hosting | Vercel (frontend), Railway (backend) - deployment pending |

## Repository Structure

```
software_engineering_2026/
├── client/          # React + Vite frontend
└── server/          # FastAPI backend
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier)

### Frontend (`/client`)

```bash
cd client
npm install
npm run dev
```

The dev server runs at http://localhost:5173

### Backend (`/server`)

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Start the API:

```bash
uvicorn main:app --reload
```

The API runs at http://localhost:8000

- Health check: `GET /` returns `{"status": "ok"}`
- Supabase connection test: `GET /health/db` returns `{"status": "ok", "database": "connected"}`

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

See `server/.env.example` for the template. Never commit `.env` files.

## Team

Add teammates as collaborators on this GitHub repository.

## License

Course project - Spring 2026.
