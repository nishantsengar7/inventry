"""Pydantic schemas for Product."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProductCreate(BaseModel):
    name:        str
    sku:         str
    description: Optional[str]  = None
    price:       float
    quantity:    int             = 0
    threshold:   int             = 10
    category_id: Optional[int]  = None
    supplier_id: Optional[int]  = None


class ProductUpdate(BaseModel):
    name:        Optional[str]   = None
    sku:         Optional[str]   = None
    description: Optional[str]   = None
    price:       Optional[float] = None
    quantity:    Optional[int]   = None
    threshold:   Optional[int]   = None
    category_id: Optional[int]   = None
    supplier_id: Optional[int]   = None


class ProductResponse(BaseModel):
    id:          int
    name:        str
    sku:         str
    description: Optional[str]
    price:       float
    quantity:    int
    threshold:   int
    category_id: Optional[int]
    supplier_id: Optional[int]
    created_at:  datetime
    updated_at:  datetime

    model_config = {"from_attributes": True}


class ProductWithDetails(ProductResponse):
    """ProductResponse extended with human-readable category/supplier names."""
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None
