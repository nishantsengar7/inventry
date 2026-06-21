"""Pydantic schemas for Supplier."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class SupplierCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[EmailStr]   = None
    phone: Optional[str]        = None
    address: Optional[str]      = None
    country: Optional[str]      = None
    is_active: bool = True


class SupplierUpdate(BaseModel):
    name: Optional[str]         = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr]   = None
    phone: Optional[str]        = None
    address: Optional[str]      = None
    country: Optional[str]      = None
    is_active: Optional[bool]   = None


class SupplierOut(BaseModel):
    id: int
    name: str
    contact_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    country: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
