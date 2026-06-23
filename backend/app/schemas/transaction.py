"""Pydantic schemas for Transaction."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

class TransactionCreate(BaseModel):
    product_id: int
    type:       str
    quantity:   int
    note:       Optional[str] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in ("IN", "OUT"):
            raise ValueError("type must be 'IN' or 'OUT'")
        return v

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("quantity must be a positive integer")
        return v

class TransactionResponse(BaseModel):
    id:           int
    product_id:   int
    product_name: Optional[str] = None
    type:         str
    quantity:     int
    note:         Optional[str]
    created_at:   datetime

    model_config = {"from_attributes": True}
