"""Category CRUD routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get(
    "",
    response_model=List[CategoryResponse],
    summary="List all categories",
)
def list_categories(db: Session = Depends(get_db)):
    """Return all categories. No authentication required."""
    return db.query(Category).order_by(Category.name).all()

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category (admin only)",
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Create a new product category. Requires admin role."""
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{payload.name}' already exists",
        )
    cat = Category(name=payload.name, description=payload.description)
    try:
        db.add(cat)
        db.commit()
        db.refresh(cat)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create category",
        ) from exc
    return cat

@router.put(
    "/{cat_id}",
    response_model=CategoryResponse,
    summary="Update a category (admin only)",
)
def update_category(
    cat_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Update category name and/or description. Requires admin role."""
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    if "name" in update_data and update_data["name"] != cat.name:
        conflict = db.query(Category).filter(Category.name == update_data["name"]).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category name '{update_data['name']}' already exists",
            )

    for field, value in update_data.items():
        setattr(cat, field, value)

    try:
        db.commit()
        db.refresh(cat)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update category",
        ) from exc
    return cat

@router.delete(
    "/{cat_id}",
    summary="Delete a category (admin only)",
)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Delete a category. Requires admin role."""
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    try:
        db.delete(cat)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete category",
        ) from exc
    return {"message": "Category deleted successfully"}
