"""
auth.py – JWT + password-hashing helpers and FastAPI dependency functions.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import TokenData

SECRET_KEY  = os.environ.get("SECRET_KEY", "change-me-in-production-please")
ALGORITHM   = os.environ.get("ALGORITHM",  "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password: str) -> str:
    """Return a bcrypt hash of the plain-text password."""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Return True when plain matches the stored bcrypt hash."""
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Encode a JWT.
    'data' should contain at least {"sub": email, "role": role}.
    Token expires in ACCESS_TOKEN_EXPIRE_HOURS by default.
    """
    payload = data.copy()
    expire  = datetime.utcnow() + (
        expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    )
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> TokenData:
    """
    Decode the JWT and return TokenData.
    Raises HTTPException 401 if the token is invalid or expired.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role:  str = payload.get("role", "viewer")
        if email is None:
            raise credentials_exc
        return TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exc

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency: validate Bearer token, load and return the User.
    Raises 401 if token is invalid, user not found, or user is inactive.
    """
    from app.models.user import User

    token_data = verify_token(token)
    user = db.query(User).filter(User.email == token_data.email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive",
        )
    return user

def require_admin(current_user=Depends(get_current_user)):
    """
    FastAPI dependency: allow only admin users.
    Raises 403 Forbidden for any other role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this action",
        )
    return current_user
