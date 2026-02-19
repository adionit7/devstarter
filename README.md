# DevStarter — Production-Ready SaaS Boilerplate

Full-stack SaaS starter with JWT auth, AI code review (Groq), Stripe subscriptions, Docker, and one-command deploy to Railway + Vercel.

**Frontend:** React 18 + Vite + Tailwind · **Backend:** FastAPI + PostgreSQL · **AI:** Groq (Llama 3.3 70B) · **Payments:** Stripe

---

## Tech Stack

| Layer    | Technology            | Notes                                      |
|----------|------------------------|--------------------------------------------|
| Frontend | React 18, Vite, TS     | SPA, `VITE_API_URL` for backend             |
| Styling  | Tailwind CSS           | Utility-first, minimal custom CSS          |
| Backend  | FastAPI (Python 3.12)   | Async, auto OpenAPI docs, Pydantic          |
| Database | PostgreSQL 16          | Users + plans; Railway provides in prod     |
| ORM      | SQLAlchemy 2           | Models in `backend/models/`                 |
| Auth     | JWT + bcrypt           | Stateless tokens, `Authorization: Bearer`  |
| AI       | Groq (Llama 3.3 70B)   | Free tier, OpenAI-compatible API           |
| Payments | Stripe                 | Checkout sessions + webhooks                |
| Run      | Docker Compose         | `db` → `backend` → `frontend` with healthchecks |
| Deploy   | Railway (backend + DB) + Vercel (frontend) | Deploy from GitHub          |

---

## Quick Start (local)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/devstarter.git && cd devstarter

# 2. Environment
cp .env.example .env
# Edit .env: set JWT_SECRET, GROQ_API_KEY (get one at console.groq.com/keys).
# Optional: Stripe keys for payments.

# 3. Run stack
docker compose up --build

# Then open:
#   http://localhost:3000   — frontend
#   http://localhost:8000/docs — API docs (Swagger)
```

---

## Environment Variables

| Variable               | Required | Description |
|------------------------|----------|-------------|
| `POSTGRES_*` / `DATABASE_URL` | For Docker | DB credentials (Compose sets `DATABASE_URL` when using PostgreSQL service). |
| `JWT_SECRET`           | Yes      | Random secret for signing JWTs (e.g. `python -c "import secrets; print(secrets.token_hex(32))"`). |
| `GROQ_API_KEY`        | For AI   | From [console.groq.com/keys](https://console.groq.com/keys) (free). |
| `STRIPE_SECRET_KEY`   | For payments | Stripe dashboard API key. |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_ENTERPRISE_PRICE_ID` | For payments | Price IDs for plans. |
| `STRIPE_WEBHOOK_SECRET` | For prod webhooks | From Stripe webhook endpoint. |
| `CORS_ORIGIN` / `FRONTEND_URL` | Prod | Your frontend origin (e.g. `https://devstarter.vercel.app`). |
| `ENVIRONMENT`         | Optional | `development` or `production`. |

See `.env.example` for a full template.

---

## Project Structure

```
devstarter/
├── backend/
│   ├── main.py              # FastAPI app, CORS, routers
│   ├── core/
│   │   ├── database.py      # SQLAlchemy engine, session
│   │   └── security.py      # bcrypt, JWT encode/decode
│   ├── models/user.py       # User table (email, plan, stripe_id…)
│   ├── schemas/user.py      # Pydantic request/response models
│   ├── routers/
│   │   ├── auth.py          # register, login, me
│   │   ├── ai.py            # code review (Groq Llama 3.3 70B)
│   │   └── payments.py      # Stripe checkout, webhook, subscription
│   ├── requirements.txt
│   └── Dockerfile           # Multi-stage, non-root user
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/           # Landing, Auth, Dashboard
│   │   └── hooks/useApi.ts
│   ├── nginx.conf           # SPA routing for Docker
│   ├── Dockerfile           # Node build → nginx serve
│   └── package.json
├── docker-compose.yml       # db, backend, frontend + healthchecks
├── .env.example
└── README.md
```

---

## API Endpoints

| Method | Path                       | Auth   | Description |
|--------|----------------------------|--------|-------------|
| GET    | /api/health                | Public | Health check (Docker/Railway) |
| POST   | /api/auth/register         | Public | Create account, get JWT |
| POST   | /api/auth/login            | Public | Login, get JWT |
| GET    | /api/auth/me               | JWT    | Current user |
| POST   | /api/ai/review             | JWT    | AI code review (Groq) |
| POST   | /api/payments/checkout     | JWT    | Create Stripe checkout |
| POST   | /api/payments/webhook      | Stripe | Stripe event handler |
| GET    | /api/payments/subscription | JWT    | Current plan |

---

## Deployment

### Backend (Railway)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub → select **devstarter**.
2. Set **Root Directory** to **backend**.
3. Add **PostgreSQL** (Railway injects `DATABASE_URL`).
4. In **Variables** set:
   - `JWT_SECRET` (generate a new one for prod)
   - `GROQ_API_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` (if using payments)
   - `ENVIRONMENT=production`
   - `CORS_ORIGIN` and `FRONTEND_URL` = your Vercel URL (e.g. `https://devstarter.vercel.app`)
5. Deploy; note the backend URL (e.g. `https://devstarter-backend-production.up.railway.app`).

Check: `https://YOUR_RAILWAY_URL/api/health` → `{"status":"healthy",...}`.

### Frontend (Vercel)

1. [vercel.com](https://vercel.com) → Add New Project → Import **devstarter**.
2. **Root Directory** → **frontend**.
3. **Framework Preset** → Vite.
4. **Environment Variables** → `VITE_API_URL` = your Railway backend URL (no trailing slash).
5. Deploy; note the Vercel URL.

### Final step

In Railway, set `CORS_ORIGIN` and `FRONTEND_URL` to your actual Vercel URL so the frontend can call the API. Redeploy if needed.

### Stripe webhook (production)

In Stripe Dashboard → Webhooks → Add endpoint:

- URL: `https://YOUR_RAILWAY_URL/api/payments/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` in Railway.

---

## Development without Docker

```bash
# Backend (from repo root)
cd backend
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set DATABASE_URL to a local Postgres or use docker run postgres
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# Set VITE_API_URL=http://localhost:8000 if needed (or use .env)
```

---

## License

MIT — use for portfolio, interviews, or your own SaaS.
