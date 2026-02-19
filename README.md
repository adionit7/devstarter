# DevStarter — Production-Ready SaaS Boilerplate

> Full-stack SaaS starter with real auth, AI code review, Stripe payments, Docker, and CI/CD.
> Built to ship. Built to explain in interviews.

**Live Demo:** [devstarter.vercel.app](https://devstarter.vercel.app) · **API Docs:** [api.devstarter.up.railway.app/docs](https://api.devstarter.up.railway.app/docs)

---

## ✅ Resume Bullets (copy these)

```
DevStarter – Production-Ready SaaS Boilerplate | React, FastAPI, PostgreSQL, OpenAI, Stripe

• Architected a full-stack SaaS boilerplate with React (Vite) frontend and FastAPI backend,
  featuring JWT authentication with bcrypt password hashing and PostgreSQL user storage.

• Integrated OpenAI GPT-4o-mini API to build an AI-powered code review feature, implementing
  prompt engineering and plan-based rate limiting (free: 5/day, pro: unlimited).

• Engineered Stripe subscription billing with checkout sessions, webhook signature verification,
  and automatic plan upgrades — handling the full SaaS payment lifecycle end-to-end.

• Built a fully automated CI/CD pipeline using GitHub Actions that builds Docker images on
  every push, runs smoke tests against live endpoints, and deploys to Railway (backend +
  PostgreSQL) and Vercel (frontend) automatically.
```

---

## Tech Stack

| Layer      | Technology           | Why it's here                                         |
|------------|----------------------|-------------------------------------------------------|
| Frontend   | React 18 + Vite      | Industry standard, fast dev server, TypeScript        |
| Styling    | Tailwind CSS         | No CSS files to maintain, consistent design system    |
| Backend    | FastAPI (Python 3.12)| Async, auto Swagger docs, Pydantic validation         |
| Database   | PostgreSQL 16        | Relational DB, handles users + subscriptions          |
| ORM        | SQLAlchemy           | Python-native DB queries, no raw SQL                  |
| Auth       | JWT + bcrypt         | Stateless tokens, secure password hashing             |
| AI         | OpenAI GPT-4o-mini   | Cheap ($0.15/1M tokens), great for code review        |
| Payments   | Stripe               | PCI compliant checkout, subscription management       |
| DevOps     | Docker + Compose     | One-command local dev, reproducible environments      |
| CI/CD      | GitHub Actions       | Auto build + test on every push to main               |
| Deployment | Railway + Vercel     | Free tiers, auto-deploy from GitHub, real live URLs   |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/yourname/devstarter && cd devstarter

# 2. Configure
cp .env.example .env
# Add your OPENAI_API_KEY and STRIPE_SECRET_KEY to .env

# 3. Run everything
docker compose up --build

# Open:
# → http://localhost:3000        (React frontend)
# → http://localhost:8000/docs   (Swagger UI — demo this in interviews!)
```

---

## Project Structure

```
devstarter/
├── backend/
│   ├── main.py                  # App entry point, router registration
│   ├── core/
│   │   ├── database.py          # SQLAlchemy engine + get_db() dependency
│   │   └── security.py          # bcrypt hashing + JWT create/verify
│   ├── models/
│   │   └── user.py              # User table (id, email, plan, stripe_id...)
│   ├── schemas/
│   │   └── user.py              # Pydantic request/response shapes
│   ├── routers/
│   │   ├── auth.py              # POST /register, POST /login, GET /me
│   │   ├── ai.py                # POST /ai/review (OpenAI)
│   │   └── payments.py          # POST /checkout, POST /webhook, GET /subscription
│   ├── requirements.txt
│   └── Dockerfile               # Multi-stage, slim, non-root user
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Client-side router (no React Router needed)
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Global user state + token management
│   │   ├── pages/
│   │   │   ├── Landing.tsx      # Marketing page + pricing
│   │   │   ├── AuthPage.tsx     # Register + Login forms
│   │   │   └── Dashboard.tsx    # Main app: health + AI review + upgrade
│   │   └── hooks/
│   │       └── useApi.ts        # Generic fetch hook with AbortController
│   ├── nginx.conf               # SPA routing + API proxy
│   └── Dockerfile               # Multi-stage: Node build → nginx serve
│
├── docker-compose.yml           # db → backend → frontend, healthcheck deps
├── .github/workflows/ci.yml     # Build images + smoke test on every push
├── .env.example                 # Template — never commit .env
└── README.md                    # This file
```

---

## API Endpoints

| Method | Route                      | Auth     | Description                    |
|--------|----------------------------|----------|--------------------------------|
| GET    | /api/health                | Public   | Health check (used by Docker)  |
| POST   | /api/auth/register         | Public   | Create account → get JWT       |
| POST   | /api/auth/login            | Public   | Login → get JWT                |
| GET    | /api/auth/me               | 🔒 JWT  | Current user profile           |
| POST   | /api/ai/review             | 🔒 JWT  | AI code review (GPT-4o-mini)   |
| POST   | /api/payments/checkout     | 🔒 JWT  | Create Stripe checkout session |
| POST   | /api/payments/webhook      | Stripe   | Handle payment events          |
| GET    | /api/payments/subscription | 🔒 JWT  | Current plan status            |

---

## Deployment Guide

### Backend → Railway

```bash
# 1. Push to GitHub
# 2. Go to railway.app → New Project → Deploy from GitHub
# 3. Add PostgreSQL plugin (one click)
# 4. Set environment variables (copy from .env)
# 5. Railway reads your Dockerfile automatically
# 6. Done — you get a URL like: api.devstarter.up.railway.app
```

### Frontend → Vercel

```bash
# 1. Go to vercel.com → New Project → Import from GitHub
# 2. Framework: Vite
# 3. Set VITE_API_URL=https://api.devstarter.up.railway.app
# 4. Deploy — you get: devstarter.vercel.app
```

### Stripe Webhook (production)

```bash
# In Stripe Dashboard → Webhooks → Add endpoint:
# URL: https://api.devstarter.up.railway.app/api/payments/webhook
# Events: checkout.session.completed, customer.subscription.deleted
# Copy the signing secret → add as STRIPE_WEBHOOK_SECRET in Railway
```

---

## Interview Talking Points

### "Walk me through your authentication flow."
> User submits email + password → backend looks up user in PostgreSQL → verifies password
> against bcrypt hash (never stores plain text) → signs a JWT with user_id + expiry →
> client stores token in localStorage → sends as `Authorization: Bearer <token>` on every
> protected request → server decodes token, no DB lookup needed. Stateless by design,
> which means it scales horizontally — any backend instance can verify any token.

### "How does the Stripe integration work?"
> User clicks Upgrade → we create a Stripe Customer (saving their ID in our DB) → create a
> Checkout Session → redirect to Stripe's hosted payment page (we never touch card details,
> so we're out of PCI scope) → Stripe redirects back on success → asynchronously POSTs a
> webhook event to our `/api/payments/webhook` → we verify the signature (critical — without
> this, anyone could fake a payment) → update the user's plan in PostgreSQL.

### "Why FastAPI over Django or Flask?"
> FastAPI is async-first so it handles concurrent requests efficiently. It auto-generates
> Swagger UI from type hints — zero config, great for demos. Pydantic validates all
> request/response shapes at runtime. Flask has none of this by default; Django is far
> heavier than needed for an API-only backend.

### "Why not AWS? Why Railway?"
> For a boilerplate meant to demonstrate architecture, Railway gives a real live URL in
> 5 minutes with zero ops overhead. The Docker-based deployment is identical to ECS —
> same Dockerfile, same environment variables. When the app needs to scale, migrating to
> ECS is a config change, not a code change.

### "What would you add next in production?"
> Alembic for database migrations (schema version control), Redis for rate limiting and
> caching AI responses, Sentry for error monitoring, refresh token rotation for security,
> and background jobs (Celery or FastAPI BackgroundTasks) for async processing.

---

## Development Without Docker

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## License

MIT — use this freely for your own projects, portfolio, and interviews.
