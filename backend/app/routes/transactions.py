"""Transaction routes: list and create stock movements."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.transaction import Transaction
from app.models.product import Product
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/transactions", tags=["Transactions"])

def _to_response(t: Transaction) -> TransactionResponse:
    """Map ORM Transaction to TransactionResponse (adds product_name)."""
    return TransactionResponse(
        id=t.id,
        product_id=t.product_id,
        product_name=t.product.name if t.product else None,
        type=t.type,
        quantity=t.quantity,
        note=t.note,
        created_at=t.created_at,
    )

@router.get(
    "/",
    response_model=List[TransactionResponse],
    summary="List transactions with optional filters",
)
def list_transactions(
    product_id: Optional[int]      = Query(None, description="Filter by product ID"),
    type:       Optional[str]      = Query(None, description="Filter by type: IN or OUT"),
    start_date: Optional[datetime] = Query(None, description="Start date (ISO 8601)"),
    end_date:   Optional[datetime] = Query(None, description="End date (ISO 8601)"),
    skip:       int                = Query(0, ge=0),
    limit:      int                = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """
    Return filtered transaction history. Requires authentication.
    Results are ordered newest-first.
    """
    q = db.query(Transaction)

    if product_id is not None:
        q = q.filter(Transaction.product_id == product_id)
    if type:
        t_upper = type.upper()
        if t_upper not in ("IN", "OUT"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="type must be 'IN' or 'OUT'",
            )
        q = q.filter(Transaction.type == t_upper)
    if start_date:
        q = q.filter(Transaction.created_at >= start_date)
    if end_date:
        q = q.filter(Transaction.created_at <= end_date)

    transactions = (
        q.order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_response(t) for t in transactions]

@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a stock movement (admin only)",
)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """
    Record a stock IN or OUT movement.

    - **IN**: increases product quantity by the given amount.
    - **OUT**: decreases product quantity. Returns 400 if stock is insufficient.

    The product's quantity is updated atomically in the same transaction.
    """
    product = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {payload.product_id} not found",
        )

    if payload.type == "OUT":
        if product.quantity < payload.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}'. "
                    f"Available: {product.quantity}, Requested: {payload.quantity}"
                ),
            )
        product.quantity -= payload.quantity
    else:
        product.quantity += payload.quantity

    txn = Transaction(
        product_id=payload.product_id,
        type=payload.type,
        quantity=payload.quantity,
        note=payload.note,
    )

    try:
        db.add(txn)
        db.commit()
        db.refresh(txn)
        db.refresh(product)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record transaction",
        ) from exc

    return _to_response(txn)
