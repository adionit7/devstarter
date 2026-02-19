"""
core/database.py
─────────────────
SQLAlchemy database engine + session factory.

Interview tip:
  get_db() is a FastAPI dependency that yields a DB session per request,
  then closes it automatically — even if the request throws an error.
  This prevents connection leaks.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://devstarter:devstarter_secret@localhost:5432/devstarter"
)

# create_engine sets up the connection pool (default: 5 connections)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Each request gets its own session from this factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All models inherit from this Base — SQLAlchemy uses it to track tables
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency — yields a DB session, always closes it after.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
