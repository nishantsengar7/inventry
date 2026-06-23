class ErrorCodes:
    # Auth errors
    AUTH_001 = "Invalid credentials"
    AUTH_002 = "Token expired"
    AUTH_003 = "Insufficient permissions"
    AUTH_004 = "Token missing"
    
    # Product errors
    PRODUCT_001 = "Product not found"
    PRODUCT_002 = "SKU already exists"
    PRODUCT_003 = "Quantity cannot be negative"
    PRODUCT_004 = "Product has active orders"
    
    # Customer errors
    CUSTOMER_001 = "Customer not found"
    CUSTOMER_002 = "Email already registered"
    CUSTOMER_003 = "Customer has existing orders"
    
    # Order errors
    ORDER_001 = "Insufficient stock"
    ORDER_002 = "Order not found"
    ORDER_003 = "Duplicate products in order"
    ORDER_004 = "Order must have items"
    ORDER_005 = "Too many items in order"
    ORDER_006 = "Invalid item quantity"
    ORDER_007 = "Quantity exceeds maximum"
    ORDER_008 = "Order already in this status"
    ORDER_009 = "Invalid status transition"
    ORDER_010 = "Cannot delete completed order"
    
    # Database errors
    DB_001 = "Database operation failed"
    DB_002 = "Transaction rollback occurred"

def make_error(
    message: str,
    code: str,
    extra: dict = None
) -> dict:
    error = {
        "error": True,
        "message": message,
        "code": code
    }
    if extra:
        error.update(extra)
    return error
