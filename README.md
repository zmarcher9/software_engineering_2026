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
    └── migrations/  # PostgreSQL/Supabase schema migrations
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

Transaction views use mock data by default for local frontend development.
Set `VITE_USE_MOCK_DATA=false` when the backend and Supabase environment are
configured and you want the frontend to call the real transaction API.

The dev server runs at http://localhost:5173

### Backend (`/server`)

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements-dev.txt
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
- Interactive API documentation: http://localhost:8000/docs
- OpenAPI document: http://localhost:8000/openapi.json

### Transaction API

Transaction routes require a Supabase Auth access token in the
`Authorization: Bearer <access-token>` header. Every lookup, update, and delete
is scoped to the authenticated user.

Register with `POST /auth/register` and log in with `POST /auth/login`. These
routes use Supabase Auth and return the same access-token format consumed by
the transaction routes. If email confirmation is enabled in Supabase, confirm
the registration before logging in.

| Method | Route | Description | Success |
|--------|-------|-------------|---------|
| `POST` | `/transactions` | Create a transaction | `201` |
| `GET` | `/transactions` | List the current user's transactions, newest first | `200` |
| `GET` | `/transactions/{transaction_id}` | Fetch one transaction | `200` |
| `PUT` | `/transactions/{transaction_id}` | Update provided transaction fields | `200` |
| `DELETE` | `/transactions/{transaction_id}` | Delete a transaction | `204` |

Create request example:

```json
{
  "category_id": "20000000-0000-0000-0000-000000000003",
  "amount": "24.80",
  "transaction_type": "expense",
  "transaction_date": "2026-07-23",
  "merchant": "Corner Cafe",
  "note": "Lunch"
}
```

The existing transaction form may send a category name instead, for example
`"category": "Shopping"`. The API resolves it against the authenticated
user’s categories. Do not send both `category` and `category_id`.
Transaction responses include both the category UUID and its display name when
available. Decimal amounts are represented as JSON strings to preserve cents
exactly; clients should convert them to numbers only for display calculations.

`amount` must be positive with at most two decimal places, and transaction
dates cannot be in the future.
`transaction_type` is either `expense` or `income`. The generated Swagger UI
documents the full request and response schemas.

Run backend unit tests from the repository root:

```bash
PYTHONPATH=server pytest server/tests
```

### Database Schema (`/server/migrations`)

Apply `server/migrations/001_initial_schema.sql`, followed by
`server/migrations/002_supabase_auth_and_rls.sql`, in the Supabase SQL Editor.

The second migration synchronizes Supabase Auth users into the application
profile table, creates default categories, and enables ownership policies for
users, categories, and transactions.

For local frontend development, first register `demo@flowfunds.local` through
the application (or change `demo_email` in the seed to an accessible test
account). Then run `server/seeds/mock_financial_data.sql` in the Supabase SQL
Editor. The repeatable seed attaches its categories and transactions to that
real authenticated user and is intended for development environments only.

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon (public) key |
| `SUPABASE_SSL_VERIFY` | Optional; set to `false` only for a trusted local environment |

See `server/.env.example` for the template. Never commit `.env` files.

## Team

Add teammates as collaborators on this GitHub repository.

## License

Course project - Spring 2026.
