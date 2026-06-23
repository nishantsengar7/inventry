"""
Dashboard routes:
  GET /dashboard/stats              – aggregate counts and totals
  GET /dashboard/recent-transactions – last 10 movements
  GET /dashboard/ai-insights        – per-product reorder predictions
"""
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.product     import Product
from app.models.category    import Category
from app.models.supplier    import Supplier
from app.models.transaction import Transaction
from app.schemas.dashboard  import DashboardStats, AIInsight, AIInsightsResponse
from app.schemas.transaction import TransactionResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get high-level inventory statistics",
)
def get_stats(
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """
    Returns aggregate metrics for the dashboard cards:
    total products, categories, suppliers, inventory value,
    low-stock count, and transaction count.
    """
    total_products   = db.query(func.count(Product.id)).scalar() or 0
    total_categories = db.query(func.count(Category.id)).scalar() or 0
    total_suppliers  = db.query(func.count(Supplier.id)).scalar() or 0
    total_transactions = db.query(func.count(Transaction.id)).scalar() or 0

    value_result = db.query(
        func.sum(Product.price * Product.quantity)
    ).scalar()
    total_inventory_value = float(value_result) if value_result else 0.0

    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.quantity <= Product.threshold)
        .scalar()
        or 0
    )

    return DashboardStats(
        total_products=total_products,
        total_categories=total_categories,
        total_suppliers=total_suppliers,
        total_inventory_value=round(total_inventory_value, 2),
        low_stock_count=low_stock_count,
        total_transactions=total_transactions,
    )

@router.get(
    "/recent-transactions",
    response_model=List[TransactionResponse],
    summary="Get the 10 most recent stock movements",
)
def recent_transactions(
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Return the last 10 transactions with product names, newest first."""
    txns = (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        TransactionResponse(
            id=t.id,
            product_id=t.product_id,
            product_name=t.product.name if t.product else None,
            type=t.type,
            quantity=t.quantity,
            note=t.note,
            created_at=t.created_at,
        )
        for t in txns
    ]

@router.get(
    "/ai-insights",
    response_model=AIInsightsResponse,
    summary="AI-powered restocking recommendations per product",
)
def ai_insights(
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """
    For each product, calculates:
    - avg_daily_usage  = total OUT units in last 30 days / 30
    - days_until_stockout = current_quantity / avg_daily_usage
    - urgency and a human-readable reorder_suggestion

    Urgency levels:
    - "critical" → already out of stock or stockout within 3 days
    - "warning"  → stockout within 7 days
    - "ok"       → healthy stock level
    """
    cutoff = datetime.utcnow() - timedelta(days=30)

    out_sums = (
        db.query(
            Transaction.product_id,
            func.sum(Transaction.quantity).label("total_out"),
        )
        .filter(
            Transaction.type == "OUT",
            Transaction.created_at >= cutoff,
        )
        .group_by(Transaction.product_id)
        .all()
    )

    out_map = {row.product_id: row.total_out for row in out_sums}

    products = db.query(Product).all()
    insights: List[AIInsight] = []

    for p in products:
        total_out_30d  = out_map.get(p.id, 0)
        avg_daily      = round(total_out_30d / 30, 2)
        current        = p.quantity

        if avg_daily > 0:
            days_left = round(current / avg_daily, 1)
        else:
            days_left = None

        if current == 0:
            urgency = "critical"
        elif days_left is not None and days_left <= 3:
            urgency = "critical"
        elif days_left is not None and days_left <= 7:
            urgency = "warning"
        else:
            urgency = "ok"

        if current == 0:
            reorder_qty    = max(p.threshold * 3, 50)
            suggestion     = f"Out of stock! Reorder {reorder_qty} units immediately"
        elif urgency == "critical":
            reorder_qty    = max(p.threshold * 3, int(avg_daily * 30))
            days_str       = f"{int(days_left)} day{'s' if days_left != 1 else ''}"
            suggestion     = f"Reorder {reorder_qty} units within {days_str}"
        elif urgency == "warning":
            reorder_qty    = max(p.threshold * 2, int(avg_daily * 14))
            days_str       = f"{int(days_left)} days"
            suggestion     = f"Reorder {reorder_qty} units within {days_str}"
        else:
            reorder_qty    = max(p.threshold, int(avg_daily * 7))
            suggestion     = f"Stock healthy. Next reorder ~{reorder_qty} units when needed"

        insights.append(
            AIInsight(
                product_id=p.id,
                product_name=p.name,
                current_stock=current,
                avg_daily_usage=avg_daily,
                days_until_stockout=days_left,
                reorder_suggestion=suggestion,
                urgency=urgency,
            )
        )

    def sort_key(i: AIInsight):
        order = {"critical": 0, "warning": 1, "ok": 2}
        return (order[i.urgency], i.days_until_stockout or 9999)

    insights.sort(key=sort_key)

    return AIInsightsResponse(
        insights=insights,
        generated_at=datetime.utcnow().isoformat() + "Z",
    )
