"""Category CRUD routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryOut])
def list_categories(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return db.query(Category).offset(skip).limit(limit).all()


@router.post("/", response_model=CategoryOut, status_code=201)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    if db.query(Category).filter(Category.name == payload.name).first():
        raise HTTPException(400, "Category name already exists")
    cat = Category(**payload.model_dump())
    db.add(cat); db.commit(); db.refresh(cat)
    return cat


@router.get("/{cat_id}", response_model=CategoryOut)
def get_category(cat_id: int, db: Session = Depends(get_db), _: object = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    return cat


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int, payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit(); db.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=204)
def delete_category(
    cat_id: int, db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    db.delete(cat); db.commit()
