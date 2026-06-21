"""Transaction routes – create and list stock movements."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.product import Product
from app.schemas.transaction import TransactionCreate, TransactionOut
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=List[TransactionOut])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = None,
    type: Optional[TransactionType] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Transaction)
    if product_id:
        q = q.filter(Transaction.product_id == product_id)
    if type:
        q = q.filter(Transaction.type == type)
    return q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=TransactionOut, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a stock movement and update the product's quantity atomically.
    - IN:  increases quantity
    - OUT: decreases quantity (rejects if insufficient stock)
    """
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")

    if payload.type == TransactionType.OUT and product.quantity < payload.quantity:
        raise HTTPException(
            400,
            f"Insufficient stock. Available: {product.quantity}, Requested: {payload.quantity}",
        )

    # Update stock quantity
    if payload.type == TransactionType.IN:
        product.quantity += payload.quantity
    else:
        product.quantity -= payload.quantity

    # Record the transaction
    txn = Transaction(
        type=payload.type,
        quantity=payload.quantity,
        note=payload.note,
        product_id=payload.product_id,
        performed_by=current_user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(txn_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(404, "Transaction not found")
    return txn
