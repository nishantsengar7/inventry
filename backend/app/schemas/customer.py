import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, field_validator


PHONE_RE = re.compile(r'^[+\d\s\-()\./]{7,20}$')


class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Full name must be at least 2 characters')
        if len(v) > 150:
            raise ValueError('Full name must be at most 150 characters')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == '':
            return None
        v = v.strip()
        if len(v) < 7:
            raise ValueError('Phone number must be at least 7 characters')
        if len(v) > 20:
            raise ValueError('Phone number must be at most 20 characters')
        if not PHONE_RE.match(v):
            raise ValueError('Phone number may only contain digits, spaces, +, -, (, ) characters')
        return v


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Full name must be at least 2 characters')
        if len(v) > 150:
            raise ValueError('Full name must be at most 150 characters')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == '':
            return None
        v = v.strip()
        if len(v) < 7:
            raise ValueError('Phone number must be at least 7 characters')
        if len(v) > 20:
            raise ValueError('Phone number must be at most 20 characters')
        if not PHONE_RE.match(v):
            raise ValueError('Phone number may only contain digits, spaces, +, -, (, ) characters')
        return v


class CustomerResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int
