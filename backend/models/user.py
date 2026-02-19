"""
models/user.py
───────────────
SQLAlchemy User model — maps to the 'users' table in PostgreSQL.

Interview tip:
  SQLAlchemy models are Python classes. Each attribute = a DB column.
  When you call Base.metadata.create_all(engine), it creates the tables
  automatically. For production, use Alembic migrations instead.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from core.database import Base
import enum


class PlanType(str, enum.Enum):
    free    = "free"
    pro     = "pro"
    enterprise = "enterprise"


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, unique=True, index=True, nullable=False)
    name       = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Stripe fields
    stripe_customer_id     = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    plan                   = Column(Enum(PlanType), default=PlanType.free, nullable=False)

    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} plan={self.plan}>"
