"""
DevStarter — FastAPI Backend v2.0
===================================
Architecture:
  main.py             → App setup, middleware, router registration
  core/database.py    → SQLAlchemy engine + session
  core/security.py    → bcrypt + JWT utilities
  models/user.py      → Database table definitions
  schemas/user.py     → Request/response shapes (Pydantic)
  routers/auth.py     → Register, Login, Me
  routers/ai.py       → OpenAI code review
  routers/payments.py → Stripe checkout + webhooks

Interview tip:
  This structure mirrors how real production FastAPI apps are organized.
  Each router owns its domain — auth, AI, payments — making the codebase
  easy to navigate and test independently.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from core.database import engine, Base
from schemas.user import HealthResponse
from routers import auth, ai, payments


# ── Create DB tables on startup ────────────────────────────────────────────────
# Interview tip: In production use Alembic migrations instead of create_all.
# Alembic tracks schema changes like Git tracks code — essential for teams.
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ready")
    yield
    print("👋 Shutting down")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DevStarter API",
    description="""
## DevStarter — Production-Ready SaaS Boilerplate

### Features
- 🔐 **Real Auth** — bcrypt passwords, JWT tokens, PostgreSQL storage
- 🤖 **AI Code Review** — GPT-4o-mini powered, plan-gated
- 💳 **Stripe Payments** — subscription checkout + webhook handling
- 🏥 **Health Check** — used by Docker, Railway, load balancers

### Quick Start
1. `POST /api/auth/register` — create account, get token
2. Add `Authorization: Bearer <token>` to protected requests
3. `POST /api/ai/review` — submit code for AI review
    """,
    version="2.0.0",
    lifespan=lifespan,
)


# ── CORS ───────────────────────────────────────────────────────────────────────
CORS_ORIGINS = [
    os.getenv("CORS_ORIGIN", "http://localhost:3000"),
    "https://devstarter.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(payments.router)


# ── System Endpoints ───────────────────────────────────────────────────────────
@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """Public health check. No auth. No DB hit. Always fast."""
    return HealthResponse(status="healthy", service="backend", version="2.0.0")


@app.get("/", tags=["Root"])
def root():
    return {"service": "DevStarter API", "version": "2.0.0", "docs": "/docs"}
