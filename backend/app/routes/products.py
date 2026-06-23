"""Product routes: CRUD + low-stock endpoint."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product  import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.schemas.product import (
    ProductCreate, ProductUpdate,
    ProductResponse, ProductWithDetails,
)
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/products", tags=["Products"])

def _to_details(p: Product) -> ProductWithDetails:
    data = ProductWithDetails.model_validate(p)
    data.category_name = p.category.name if p.category else None
    data.supplier_name = p.supplier.name if p.supplier else None
    return data

@router.get(
    "/low-stock",
    response_model=List[dict],
    summary="List products at or below their reorder threshold",
)
def get_low_stock(
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    """
    Returns all products where quantity <= threshold.
    Each item includes an urgency field:
    - "critical" → quantity == 0
    - "warning"  → quantity <= threshold // 2
    - "low"      → quantity <= threshold
    """
    products = (
        db.query(Product)
        .filter(Product.quantity <= Product.threshold)
        .order_by(Product.quantity.asc())
        .all()
    )

    result = []
    for p in products:
        if p.quantity == 0:
            urgency = "critical"
        elif p.quantity <= p.threshold // 2:
            urgency = "warning"
        else:
            urgency = "low"

        result.append({
            "id":           p.id,
            "name":         p.name,
            "sku":          p.sku,
            "quantity":     p.quantity,
            "threshold":    p.threshold,
            "urgency":      urgency,
            "category_name": p.category.name if p.category else None,
            "supplier_name": p.supplier.name if p.supplier else None,
        })
    return result

@router.get(
    "",
    response_model=List[ProductWithDetails],
    summary="List products with optional filters",
)
def list_products(
    search:      Optional[str]  = Query(None, description="Filter by name or SKU substring"),
    category_id: Optional[int]  = Query(None, description="Filter by category ID"),
    supplier_id: Optional[int]  = Query(None, description="Filter by supplier ID"),
    low_stock:   Optional[bool] = Query(None, description="If true, return only low-stock items"),
    skip:        int            = Query(0,    ge=0),
    limit:       int            = Query(100,  ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Return products list. Supports:
    - full-text search on name / SKU
    - category and supplier filters
    - low_stock boolean flag
    - pagination via skip/limit
    No authentication required.
    """
    q = db.query(Product)

    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (Product.name.ilike(pattern)) | (Product.sku.ilike(pattern))
        )
    if category_id is not None:
        q = q.filter(Product.category_id == category_id)
    if supplier_id is not None:
        q = q.filter(Product.supplier_id == supplier_id)
    if low_stock:
        q = q.filter(Product.quantity <= Product.threshold)

    products = q.order_by(Product.name).offset(skip).limit(limit).all()
    return [_to_details(p) for p in products]

@router.get(
    "/{product_id}",
    response_model=ProductWithDetails,
    summary="Get a single product by ID",
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Return a single product with category and supplier names."""
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _to_details(p)

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product (admin only)",
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Create a product. SKU must be unique. Requires admin role."""
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SKU '{payload.sku}' is already in use",
        )

    if payload.category_id and not db.query(Category).filter(Category.id == payload.category_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")
    if payload.supplier_id and not db.query(Supplier).filter(Supplier.id == payload.supplier_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supplier not found")

    product = Product(**payload.model_dump())
    try:
        db.add(product)
        db.commit()
        db.refresh(product)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product",
        ) from exc
    return product

@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update a product (admin only)",
)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Update any product fields. Requires admin role."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    if "sku" in update_data and update_data["sku"] != product.sku:
        if db.query(Product).filter(Product.sku == update_data["sku"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SKU '{update_data['sku']}' is already in use",
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product",
        ) from exc
    return product

@router.delete(
    "/{product_id}",
    summary="Delete a product (admin only)",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Delete a product and its transaction history. Requires admin role."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    try:
        db.delete(product)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete product",
        ) from exc
    return {"message": "Product deleted successfully"}
