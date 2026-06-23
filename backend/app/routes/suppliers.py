"""Supplier CRUD routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.utils.auth import require_admin

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get(
    "",
    response_model=List[SupplierResponse],
    summary="List all suppliers",
)
def list_suppliers(db: Session = Depends(get_db)):
    """Return all suppliers. No authentication required."""
    return db.query(Supplier).order_by(Supplier.name).all()

@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier (admin only)",
)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Create a new supplier record. Requires admin role."""
    sup = Supplier(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
    )
    try:
        db.add(sup)
        db.commit()
        db.refresh(sup)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create supplier",
        ) from exc
    return sup

@router.put(
    "/{sup_id}",
    response_model=SupplierResponse,
    summary="Update a supplier (admin only)",
)
def update_supplier(
    sup_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Update supplier details. Requires admin role."""
    sup = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not sup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    for field, value in update_data.items():
        setattr(sup, field, value)

    try:
        db.commit()
        db.refresh(sup)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update supplier",
        ) from exc
    return sup

@router.delete(
    "/{sup_id}",
    summary="Delete a supplier (admin only)",
)
def delete_supplier(
    sup_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Delete a supplier. Requires admin role."""
    sup = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not sup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    try:
        db.delete(sup)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete supplier",
        ) from exc
    return {"message": "Supplier deleted successfully"}
