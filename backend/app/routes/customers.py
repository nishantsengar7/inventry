"""Customer CRUD routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
)
from app.utils.auth import require_admin
from app.utils.errors import make_error

router = APIRouter(prefix="/customers", tags=["Customers"])

def check_email_unique(
    email: str,
    db: Session,
    exclude_id: int = None
):
    query = db.query(Customer).filter(
        Customer.email == email.lower().strip()
    )
    
    # Exclude current customer on update
    if exclude_id:
        query = query.filter(
            Customer.id != exclude_id
        )
    
    existing = query.first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": "A customer with this email already exists",
                "code": "CUSTOMER_002",
                "existing_id": existing.id
            }
        )


@router.get(
    "",
    response_model=CustomerListResponse,
    summary="List customers with optional search and pagination",
)
def list_customers(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Return all customers. Supports search by name or email. No authentication required."""
    query = db.query(Customer)

    if search:
        term = f"%{search}%"
        query = query.filter(
            Customer.full_name.ilike(term) | Customer.email.ilike(term)
        )

    total = query.count()
    customers = (
        query.order_by(Customer.full_name)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return CustomerListResponse(customers=customers, total=total)


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Get a single customer by ID",
)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Fetch a customer by primary key. No authentication required."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Customer not found",
                "code": "CUSTOMER_001",
            },
        )
    return customer


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new customer (admin only)",
)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Create a new customer. Requires admin role. Email must be unique."""
    check_email_unique(payload.email, db)

    customer = Customer(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        phone=payload.phone,
    )

    try:
        db.add(customer)
        db.commit()
        db.refresh(customer)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create customer",
        ) from exc

    return customer


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Update a customer (admin only)",
)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Partially update a customer. Requires admin role."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Customer not found",
                "code": "CUSTOMER_001",
            },
        )

    if payload.email:
        check_email_unique(payload.email, db, exclude_id=customer_id)

    update_data = payload.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"]:
        update_data["email"] = update_data["email"].lower()

    if "full_name" in update_data and update_data["full_name"]:
        update_data["full_name"] = update_data["full_name"].strip()

    for field, value in update_data.items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update customer",
        ) from exc

    return customer


@router.delete(
    "/{customer_id}",
    summary="Delete a customer (admin only)",
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Delete a customer. Requires admin role."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Customer not found",
                "code": "CUSTOMER_001",
            },
        )

    # Check if customer has orders
    has_orders = db.query(Order).filter(Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "Cannot delete customer with existing orders",
                "code": "CUSTOMER_003",
            },
        )

    try:
        db.delete(customer)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete customer",
        ) from exc

    return {"message": "Customer deleted successfully", "id": customer_id}
