"""Supplier CRUD routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("/", response_model=List[SupplierOut])
def list_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Supplier).offset(skip).limit(limit).all()


@router.post("/", response_model=SupplierOut, status_code=201)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sup = Supplier(**payload.model_dump())
    db.add(sup); db.commit(); db.refresh(sup)
    return sup


@router.get("/{sup_id}", response_model=SupplierOut)
def get_supplier(sup_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sup = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not sup:
        raise HTTPException(404, "Supplier not found")
    return sup


@router.put("/{sup_id}", response_model=SupplierOut)
def update_supplier(sup_id: int, payload: SupplierUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sup = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not sup:
        raise HTTPException(404, "Supplier not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sup, field, value)
    db.commit(); db.refresh(sup)
    return sup


@router.delete("/{sup_id}", status_code=204)
def delete_supplier(sup_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sup = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not sup:
        raise HTTPException(404, "Supplier not found")
    db.delete(sup); db.commit()
