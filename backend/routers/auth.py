"""
routers/auth.py
────────────────
Real authentication — bcrypt hashed passwords stored in PostgreSQL.

Endpoints:
  POST /api/auth/register  → Create account
  POST /api/auth/login     → Login, get JWT
  GET  /api/auth/me        → Get current user (protected)

Interview tip:
  The flow is: register → hash password → store in DB → login →
  verify hash → issue JWT → client stores JWT → sends on every request.
  The server never stores or sees the plain password after registration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, decode_token
from models.user import User
from schemas.user import RegisterRequest, LoginRequest, AuthResponse, UserPublic

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new user account.
    - Checks for duplicate email
    - Hashes password with bcrypt (never stored plain)
    - Returns JWT immediately so user is logged in after signup
    """
    # Check if email already exists
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Create user with hashed password
    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)  # refresh to get the auto-generated id + created_at

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        user=UserPublic.model_validate(user)
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email + password.
    Interview tip: We always call verify_password even if user doesn't exist.
    This prevents timing attacks that could reveal which emails are registered.
    """
    user = db.query(User).filter(User.email == body.email).first()

    # Dummy hash to prevent timing attacks — always do the bcrypt work
    dummy_hash = "$2b$12$irrelevant.hash.to.prevent.timing.attacks.padding"
    password_to_check = user.hashed_password if user else dummy_hash

    if not user or not verify_password(body.password, password_to_check):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated."
        )

    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        user=UserPublic.model_validate(user)
    )


@router.get("/me", response_model=UserPublic)
def get_me(token_data: dict = Depends(decode_token), db: Session = Depends(get_db)):
    """
    Returns the currently logged-in user's profile.
    The JWT is decoded by decode_token dependency — no DB hit for auth itself.
    """
    user = db.query(User).filter(User.id == int(token_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserPublic.model_validate(user)
