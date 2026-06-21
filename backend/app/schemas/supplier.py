"""Pydantic schemas for Supplier."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class SupplierCreate(BaseModel):
    name:    str
    email:   Optional[EmailStr] = None
    phone:   Optional[str]      = None
    address: Optional[str]      = None


class SupplierUpdate(BaseModel):
    name:    Optional[str]      = None
    email:   Optional[EmailStr] = None
    phone:   Optional[str]      = None
    address: Optional[str]      = None


class SupplierResponse(BaseModel):
    id:         int
    name:       str
    email:      Optional[str]
    phone:      Optional[str]
    address:    Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
