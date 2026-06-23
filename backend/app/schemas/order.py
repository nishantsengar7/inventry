from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    status: str
    total_amount: float
    notes: Optional[str] = None
    items: List[OrderItemResponse]
    item_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderListItem(BaseModel):
    id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    status: str
    total_amount: float
    item_count: int
    first_product_name: Optional[str] = None
    more_items_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    orders: List[OrderListItem]
    total: int
