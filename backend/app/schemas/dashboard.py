"""Pydantic schemas for Dashboard endpoints."""
from typing import List, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_products:         int
    total_categories:       int
    total_suppliers:        int
    total_inventory_value:  float
    low_stock_count:        int
    total_transactions:     int


class AIInsight(BaseModel):
    """Per-product AI-generated restocking insight."""
    product_id:         int
    product_name:       str
    current_stock:      int
    avg_daily_usage:    float          # OUT units / 30 days
    days_until_stockout: Optional[float]  # None if avg_daily_usage == 0
    reorder_suggestion: str
    urgency:            str            # "critical" | "warning" | "ok"


class AIInsightsResponse(BaseModel):
    insights: List[AIInsight]
    generated_at: str                  # ISO timestamp string
