"""
schemas/user.py
────────────────
Pydantic schemas define the shape of API request bodies and responses.

Interview tip:
  SQLAlchemy models = database layer (how data is stored).
  Pydantic schemas  = API layer (what clients send/receive).
  Keeping them separate means you never accidentally expose
  sensitive fields like hashed_password in an API response.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth ───────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr          # Pydantic validates email format automatically
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserPublic"       # forward reference resolved below


# ── User ───────────────────────────────────────────────────────────────────────

class UserPublic(BaseModel):
    """Safe to send to frontend — no hashed_password, no internal IDs."""
    id:         int
    name:       str
    email:      str
    plan:       str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}  # lets us do UserPublic.model_validate(db_user)


# ── Health ─────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:  str
    service: str
    version: str


# ── AI ─────────────────────────────────────────────────────────────────────────

class CodeReviewRequest(BaseModel):
    code:     str
    language: str = "python"

class CodeReviewResponse(BaseModel):
    review:   str
    language: str
    model:    str


# ── Stripe ─────────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str   # "pro" or "enterprise"

class CheckoutResponse(BaseModel):
    checkout_url: str

class SubscriptionStatus(BaseModel):
    plan:                   str
    stripe_customer_id:     Optional[str]
    stripe_subscription_id: Optional[str]


# resolve forward reference
AuthResponse.model_rebuild()
