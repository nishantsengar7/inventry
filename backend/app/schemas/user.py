"""Pydantic schemas for User and Auth."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ── Request schemas ───────────────────────────────────────────

class UserCreate(BaseModel):
    name:     str
    email:    EmailStr
    password: str
    role:     str = "viewer"   # "admin" | "viewer"


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


# ── Response schemas ──────────────────────────────────────────

class UserResponse(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       str
    is_active:  bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Token schemas ─────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role:  Optional[str] = None
