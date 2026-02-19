"""
core/security.py
─────────────────
Password hashing (bcrypt) and JWT creation/verification.

Interview tip:
  bcrypt is slow BY DESIGN — it makes brute-force attacks expensive.
  The work factor (rounds=12) means ~250ms per hash on a modern CPU.
  That's fine for login, but would kill a bulk import — plan accordingly.
"""

from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import datetime
import os

# bcrypt context — handles hashing + verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET    = os.getenv("JWT_SECRET", "dev_secret_change_in_production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

bearer_scheme = HTTPBearer()


def hash_password(plain: str) -> str:
    """Hash a plain-text password. Store the result — never the plain password."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check a login attempt against the stored hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, email: str) -> str:
    """
    Sign a JWT with user_id + email + expiry.
    Interview tip: We store user_id (not just email) so we can look up
    the full user on every protected request without re-querying by email.
    """
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """
    FastAPI dependency — decodes + validates the Bearer token.
    Raises 401 if token is missing, expired, or tampered with.
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
