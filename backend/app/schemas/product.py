"""Pydantic schemas for Product."""
from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: Decimal
    quantity: int = 0
    reorder_level: int = 10
    unit: str = "pcs"
    image_url: Optional[str] = None
    is_active: bool = True
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductUpdate(BaseModel):
    sku: Optional[str]          = None
    name: Optional[str]         = None
    description: Optional[str]  = None
    price: Optional[Decimal]    = None
    quantity: Optional[int]     = None
    reorder_level: Optional[int]= None
    unit: Optional[str]         = None
    image_url: Optional[str]    = None
    is_active: Optional[bool]   = None
    category_id: Optional[int]  = None
    supplier_id: Optional[int]  = None


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    description: Optional[str]
    price: Decimal
    quantity: int
    reorder_level: int
    unit: Optional[str]
    is_active: bool
    stock_status: str
    category_id: Optional[int]
    supplier_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
