"""Pydantic schemas for Transaction."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    type: TransactionType
    quantity: int
    product_id: int
    note: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    type: TransactionType
    quantity: int
    note: Optional[str]
    product_id: int
    performed_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
