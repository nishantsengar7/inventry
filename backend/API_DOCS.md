# InvenTrack API Reference

Base URL: http://localhost:8000
Auth: Bearer JWT token in header

## Authentication

### POST /auth/login
Request:
```json
{
  "email": "admin@demo.com",
  "password": "admin123"
}
```
Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### POST /auth/register
Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "viewer"
}
```

## Products

### GET /products
Query params:
- `search`=laptop
- `category_id`=1
- `supplier_id`=2
- `low_stock`=true

Response:
```json
[
  {
    "id": 1,
    "name": "Wireless Mouse",
    "sku": "ELEC-003",
    "price": 899.00,
    "quantity": 0,
    "threshold": 5,
    "category": "Electronics",
    "supplier": "TechCorp",
    "status": "critical"
  }
]
```

### POST /products (Admin only)
```json
{
  "name": "New Product",
  "sku": "PROD-001",
  "price": 299.00,
  "quantity": 50,
  "threshold": 10,
  "category_id": 1,
  "supplier_id": 1
}
```

## Transactions

### POST /transactions (Admin only)
```json
{
  "product_id": 1,
  "type": "OUT",
  "quantity": 5,
  "note": "Sold to customer"
}
```
Auto-updates product quantity on success.

## AI Endpoints

### GET /ai/forecast
No body needed.
Returns stockout predictions for all products.
```json
[
  {
    "product_name": "USB-C Cable",
    "current_stock": 8,
    "avg_daily_usage": 1.2,
    "days_until_stockout": 6,
    "stockout_date": "2026-06-27",
    "trend": "increasing",
    "confidence": "high"
  }
]
```

### POST /ai/chat
```json
{
  "message": "Which products need reordering?",
  "conversation_history": []
}
```
Response:
```json
{
  "response": "Based on current stock levels, 3 products need immediate reordering:\n1. USB-C Cable (8 units, 6 days left)\n2. Protein Bar Pack (2 units, critical)\n3. Formal Trousers (4 units, 3 days left)",
  "tokens_used": 245
}
```

## Error Responses
```json
{
  "error": true,
  "message": "Insufficient stock",
  "code": "STOCK_001"
}
```

### Status Codes
- **400 Bad Request**     → Validation error
- **401 Unauthorized**    → Invalid/missing token
- **403 Forbidden**       → Admin required (Viewer restricted)
- **404 Not Found**       → Resource not found
- **429 Too Many Req**    → Rate limit exceeded
- **500 Server Error**    → Unexpected server error
