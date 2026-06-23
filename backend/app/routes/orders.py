from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.transaction import Transaction
from app.schemas.order import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderListItem,
    OrderListResponse,
    OrderItemResponse,
)
from app.utils.auth import require_admin, get_current_user
from app.utils.errors import make_error

router = APIRouter()

# Define allowed transitions
VALID_TRANSITIONS = {
    "pending": ["completed", "cancelled"],
    "completed": [],   # terminal state
    "cancelled": []    # terminal state
}

def validate_no_duplicate_products(items):
    product_ids = [item.product_id for item in items]
    
    if len(product_ids) != len(set(product_ids)):
        seen = set()
        duplicates = set()
        for pid in product_ids:
            if pid in seen:
                duplicates.add(pid)
            seen.add(pid)
        
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": "Duplicate products found in order. Combine quantities into a single item.",
                "code": "ORDER_003",
                "duplicate_product_ids": list(duplicates)
            }
        )

def validate_order_items(items):
    # Rule 1: Must have at least 1 item
    if not items or len(items) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": "Order must contain at least one item",
                "code": "ORDER_004"
            }
        )
    
    # Rule 2: Max 20 items per order
    if len(items) > 20:
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": "Order cannot contain more than 20 items",
                "code": "ORDER_005"
            }
        )
    
    # Rule 3: Each quantity must be >= 1
    for item in items:
        if item.quantity < 1:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": True,
                    "message": f"Quantity must be at least 1 for product id {item.product_id}",
                    "code": "ORDER_006"
                }
            )
        
        # Rule 4: Max 1000 units per item
        if item.quantity > 1000:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": True,
                    "message": f"Cannot order more than 1000 units of a single product",
                    "code": "ORDER_007"
                }
            )

def create_order_items_with_snapshot(
    order_id, request_items, product_map, db
):
    order_items = []
    total_amount = 0.0
    
    for item in request_items:
        product = product_map[item.product_id]
        
        # Snapshot current price
        unit_price = round(product.price, 2)
        
        # Calculate subtotal precisely
        subtotal = round(
            unit_price * item.quantity, 2
        )
        
        order_item = OrderItem(
            order_id=order_id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=unit_price,
            subtotal=subtotal
        )
        
        order_items.append(order_item)
        total_amount += subtotal
    
    # Round final total to avoid
    # floating point issues
    total_amount = round(total_amount, 2)
    
    return order_items, total_amount

def restore_stock_for_order(
    order: Order,
    db: Session
):
    """
    Restore stock for all items in order.
    Creates reversal Transaction records.
    Called on cancellation or deletion.
    """
    for order_item in order.order_items:
        if order_item.product_id is None:
            # Product was deleted — skip
            continue
        
        product = db.query(Product).filter(
            Product.id == order_item.product_id
        ).with_for_update().first()
        
        if product:
            # Restore quantity
            product.quantity += order_item.quantity
            
            # Create reversal transaction
            transaction = Transaction(
                product_id=order_item.product_id,
                type="IN",
                quantity=order_item.quantity,
                note=f"Order #{order.id} cancelled - stock restored"
            )
            db.add(transaction)
        # If product deleted: skip silently

def validate_status_transition(
    current: str,
    new: str,
    order_id: int
):
    allowed = VALID_TRANSITIONS.get(current, [])
    
    if new == current:
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": f"Order is already {current}",
                "code": "ORDER_008"
            }
        )
    
    if new not in allowed:
        raise HTTPException(
            status_code=400,
            detail={
                "error": True,
                "message": f"Cannot change order status from '{current}' to '{new}'. Allowed transitions from {current}: {allowed or 'none'}",
                "code": "ORDER_009",
                "current_status": current,
                "requested_status": new,
                "allowed_transitions": allowed
            }
        )

def build_order_response(
    order: Order,
    db: Session
) -> dict:
    """
    Build complete order response
    with customer + item details.
    """
    # Get customer details
    customer = None
    if order.customer_id:
        customer = db.query(Customer).filter(
            Customer.id == order.customer_id
        ).first()
    
    # Build items list
    items = []
    for oi in order.order_items:
        product_name = None
        product_sku = None
        
        if oi.product_id:
            product = db.query(Product).filter(
                Product.id == oi.product_id
            ).first()
            if product:
                product_name = product.name
                product_sku = product.sku
        
        items.append({
            "id": oi.id,
            "product_id": oi.product_id,
            "product_name": product_name or "Deleted Product",
            "product_sku": product_sku or "N/A",
            "quantity": oi.quantity,
            "unit_price": oi.unit_price,
            "subtotal": oi.subtotal
        })
    
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": customer.full_name if customer else "Deleted Customer",
        "customer_email": customer.email if customer else None,
        "status": order.status,
        "total_amount": order.total_amount,
        "notes": order.notes,
        "items": items,
        "item_count": len(items),
        "created_at": order.created_at,
        "updated_at": order.updated_at
    }

@router.post("", status_code=201)
async def create_order(
    request: OrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        # STEP 1: Basic validations
        validate_order_items(request.items)
        validate_no_duplicate_products(request.items)
        
        # STEP 2: Validate customer
        customer = db.query(Customer).filter(
            Customer.id == request.customer_id
        ).first()
        if not customer:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": True,
                    "message": "Customer not found",
                    "code": "CUSTOMER_001"
                }
            )
        
        # STEP 3: Lock + validate all products
        product_map = {}
        stock_errors = []
        
        for item in request.items:
            product = db.query(Product).filter(
                Product.id == item.product_id
            ).with_for_update().first()
            
            if not product:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": True,
                        "message": f"Product with id {item.product_id} not found",
                        "code": "PRODUCT_001"
                    }
                )
            
            product_map[item.product_id] = product
            
            if product.quantity < item.quantity:
                stock_errors.append({
                    "product_id": item.product_id,
                    "product_name": product.name,
                    "sku": product.sku,
                    "available": product.quantity,
                    "requested": item.quantity,
                    "shortage": item.quantity - product.quantity
                })
        
        # STEP 4: Raise all stock errors at once
        if stock_errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": True,
                    "message": "Insufficient stock for one or more items",
                    "code": "ORDER_001",
                    "stock_errors": stock_errors
                }
            )
        
        # STEP 5: Create order record
        order = Order(
            customer_id=request.customer_id,
            status="pending",
            notes=request.notes,
            total_amount=0.0
        )
        db.add(order)
        db.flush()  # get order.id
        
        # STEP 6: Create items + snapshot prices
        order_items, total_amount = (
            create_order_items_with_snapshot(
                order.id,
                request.items,
                product_map,
                db
            )
        )
        
        for order_item in order_items:
            db.add(order_item)
        
        # STEP 7: Update order total
        order.total_amount = total_amount
        
        # STEP 8: Reduce stock + create transaction records
        for item in request.items:
            product = product_map[item.product_id]
            product.quantity -= item.quantity
            
            # Hard floor enforcement
            if product.quantity < 0:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": True,
                        "message": "Stock cannot go negative",
                        "code": "ORDER_002"
                    }
                )
            
            # Create transaction record
            transaction = Transaction(
                product_id=item.product_id,
                type="OUT",
                quantity=item.quantity,
                note=f"Order #{order.id} - {customer.full_name}"
            )
            db.add(transaction)
        
        # STEP 9: Commit everything at once
        db.commit()
        db.refresh(order)
        
        return build_order_response(order, db)
    
    except HTTPException:
        db.rollback()
        raise  # re-raise HTTP exceptions as-is
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "message": "Order creation failed. All changes rolled back.",
                "code": "DB_001",
                "detail": str(e)
            }
        )

@router.get("", summary="List all orders with optional filters")
def list_orders(
    customer_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user)
):
    query = db.query(Order)
    
    if customer_id is not None:
        query = query.filter(Order.customer_id == customer_id)
        
    if status is not None:
        query = query.filter(Order.status == status)
        
    total = query.count()
    
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    list_items = []
    for order in orders:
        item_count = sum(item.quantity for item in order.order_items)
        first_name = None
        more_count = 0
        if order.order_items:
            first_item = order.order_items[0]
            first_name = first_item.product.name if first_item.product else "Deleted Product"
            more_count = max(0, len(order.order_items) - 1)

        list_items.append(OrderListItem(
            id=order.id,
            customer_name=order.customer.full_name if order.customer else "Deleted Customer",
            customer_email=order.customer.email if order.customer else None,
            status=order.status,
            total_amount=order.total_amount,
            item_count=len(order.order_items),
            first_product_name=first_name,
            more_items_count=more_count,
            created_at=order.created_at
        ))
        
    return OrderListResponse(orders=list_items, total=total)

@router.get("/{id}", summary="Get single order with full details")
def get_order(
    id: int,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail={
                "error": True,
                "message": "Order not found",
                "code": "ORDER_002"
            }
        )
    return build_order_response(order, db)

@router.delete("/{id}", summary="Cancel and delete an order (Admin only)")
async def delete_order(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        order = db.query(Order).filter(
            Order.id == id
        ).with_for_update().first()
        
        if not order:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": True,
                    "message": "Order not found",
                    "code": "ORDER_002"
                }
            )
        
        # Block deletion of completed orders
        if order.status == "completed":
            raise HTTPException(
                status_code=400,
                detail={
                    "error": True,
                    "message": "Cannot delete a completed order. Completed orders are permanent records. If needed, contact a super admin.",
                    "code": "ORDER_010"
                }
            )
        
        # Restore stock only if was pending (cancelled orders already restored)
        if order.status == "pending":
            restore_stock_for_order(order, db)
        
        # Store info before deletion
        deleted_id = order.id
        was_pending = order.status == "pending"
        
        # Delete order (cascade deletes items)
        db.delete(order)
        db.commit()
        
        return {
            "message": f"Order #{deleted_id} deleted successfully. Stock has been restored.",
            "id": deleted_id,
            "stock_restored": was_pending
        }
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "message": "Order deletion failed",
                "code": "DB_001"
            }
        )

@router.patch("/{id}/status", summary="Update order status (Admin only)")
async def update_order_status(
    id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    try:
        order = db.query(Order).filter(
            Order.id == id
        ).with_for_update().first()
        
        if not order:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": True,
                    "message": "Order not found",
                    "code": "ORDER_002"
                }
            )
        
        # Validate transition
        validate_status_transition(
            order.status,
            body.status,
            order.id
        )
        
        # If cancelling: restore stock
        if body.status == "cancelled":
            restore_stock_for_order(order, db)
        
        # Update status
        order.status = body.status
        db.commit()
        db.refresh(order)
        
        return build_order_response(order, db)
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={
                "error": True,
                "message": "Status update failed",
                "code": "DB_001"
            }
        )
