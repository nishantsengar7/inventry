"""
seed.py – Populate the database with realistic demo data.

Called once on application startup when the users table is empty.
Creates: 2 users, 5 categories, 5 suppliers, 15 products, 30 transactions.
"""

import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user        import User
from app.models.category    import Category
from app.models.supplier    import Supplier
from app.models.product     import Product
from app.models.transaction import Transaction
from app.utils.auth         import hash_password


# ── Seed data definitions ─────────────────────────────────────

USERS = [
    {"name": "Admin User",   "email": "admin@demo.com",  "password": "admin123",  "role": "admin"},
    {"name": "Viewer User",  "email": "viewer@demo.com", "password": "viewer123", "role": "viewer"},
]

CATEGORIES = [
    {"name": "Electronics",       "description": "Electronic devices, components, and accessories"},
    {"name": "Clothing",          "description": "Apparel, footwear, and fashion accessories"},
    {"name": "Food & Beverages",  "description": "Packaged food, drinks, and consumables"},
    {"name": "Office Supplies",   "description": "Stationery, printers, and desk accessories"},
    {"name": "Tools & Hardware",  "description": "Hand tools, power tools, and hardware"},
]

SUPPLIERS = [
    {"name": "TechCorp",   "email": "orders@techcorp.com",   "phone": "+1-555-0101", "address": "123 Silicon Ave, San Jose, CA"},
    {"name": "FashionHub", "email": "supply@fashionhub.com", "phone": "+1-555-0202", "address": "456 Style Blvd, New York, NY"},
    {"name": "FreshFoods", "email": "bulk@freshfoods.com",   "phone": "+1-555-0303", "address": "789 Farm Rd, Fresno, CA"},
    {"name": "OfficeWorld","email": "b2b@officeworld.com",   "phone": "+1-555-0404", "address": "321 Corporate Dr, Chicago, IL"},
    {"name": "ToolMaster", "email": "trade@toolmaster.com",  "phone": "+1-555-0505", "address": "654 Workshop Ln, Detroit, MI"},
]

# Each product: (name, sku, description, price, quantity, threshold, cat_idx, sup_idx)
# cat_idx and sup_idx are 0-based indices into CATEGORIES / SUPPLIERS
PRODUCTS = [
    # Electronics (cat 0, sup 0 – TechCorp)
    ("Wireless Keyboard",    "ELEC-001", "Bluetooth mechanical keyboard, compact layout", 79.99, 45,  10, 0, 0),
    ("USB-C Hub 7-in-1",    "ELEC-002", "Multi-port USB-C hub with HDMI and SD card",   49.99, 3,   10, 0, 0),  # low stock
    ("27\" Monitor FHD",    "ELEC-003", "Full HD IPS panel, 75Hz, VESA compatible",     249.99, 18, 5,  0, 0),
    # Clothing (cat 1, sup 1 – FashionHub)
    ("Men's Polo Shirt",    "CLTH-001", "100% cotton polo, available S-XXL",             24.99, 0,   15, 1, 1),  # out of stock
    ("Women's Sneakers",    "CLTH-002", "Lightweight running shoes, multiple colors",    59.99, 32,  20, 1, 1),
    ("Winter Jacket Unisex","CLTH-003", "Waterproof puffer jacket, -10°C rated",         89.99, 7,   10, 1, 1),  # low stock
    # Food & Beverages (cat 2, sup 2 – FreshFoods)
    ("Organic Green Tea",   "FOOD-001", "Premium loose-leaf green tea, 250g tin",         12.99, 120, 30, 2, 2),
    ("Protein Bar 12-Pack", "FOOD-002", "Whey protein bars, mixed flavours",             18.99, 4,   20, 2, 2),  # low stock
    ("Sparkling Water 24pk","FOOD-003", "Natural mineral sparkling water, 330ml cans",    14.99, 200, 50, 2, 2),
    # Office Supplies (cat 3, sup 3 – OfficeWorld)
    ("A4 Paper 500 sheets", "OFFC-001", "80gsm white multipurpose printing paper",        8.99, 350, 100, 3, 3),
    ("Gel Pen 10-Pack",     "OFFC-002", "0.5mm black gel pens, smooth writing",           5.49, 9,   20, 3, 3),  # low stock
    ("Stapler Heavy Duty",  "OFFC-003", "40-sheet capacity metal stapler with staples",  14.99, 25,  10, 3, 3),
    # Tools & Hardware (cat 4, sup 4 – ToolMaster)
    ("Cordless Drill 18V",  "TOOL-001", "Brushless motor, 2 batteries included",         119.99, 14, 5,  4, 4),
    ("Tape Measure 5m",     "TOOL-002", "Auto-lock steel tape, magnetic tip",              9.99, 2,   10, 4, 4),  # critical
    ("Safety Gloves L",     "TOOL-003", "Cut-resistant level 5 work gloves, pair",        12.49, 40,  15, 4, 4),
]


def _random_date(days_back: int) -> datetime:
    """Return a random datetime within the last `days_back` days."""
    offset_seconds = random.randint(0, days_back * 24 * 3600)
    return datetime.utcnow() - timedelta(seconds=offset_seconds)


def seed_database(db: Session) -> None:
    """
    Populate the database with demo data.
    Safe to call multiple times – skips if users table already has rows.
    """
    # Guard: only seed once
    if db.query(User).count() > 0:
        print("⏭️  Seed skipped – data already exists.")
        return

    print("🌱 Seeding demo data…")

    # ── Users ────────────────────────────────────────────────
    user_objs = []
    for u in USERS:
        user = User(
            name=u["name"],
            email=u["email"],
            password=hash_password(u["password"]),
            role=u["role"],
        )
        db.add(user)
        user_objs.append(user)
    db.flush()

    # ── Categories ───────────────────────────────────────────
    cat_objs = []
    for c in CATEGORIES:
        cat = Category(name=c["name"], description=c["description"])
        db.add(cat)
        cat_objs.append(cat)
    db.flush()

    # ── Suppliers ────────────────────────────────────────────
    sup_objs = []
    for s in SUPPLIERS:
        sup = Supplier(
            name=s["name"],
            email=s["email"],
            phone=s["phone"],
            address=s["address"],
        )
        db.add(sup)
        sup_objs.append(sup)
    db.flush()

    # ── Products ─────────────────────────────────────────────
    product_objs = []
    for (name, sku, desc, price, qty, threshold, cat_i, sup_i) in PRODUCTS:
        prod = Product(
            name=name,
            sku=sku,
            description=desc,
            price=price,
            quantity=qty,
            threshold=threshold,
            category_id=cat_objs[cat_i].id,
            supplier_id=sup_objs[sup_i].id,
        )
        db.add(prod)
        product_objs.append(prod)
    db.flush()

    # ── Transactions (30 realistic entries over last 30 days) ─
    notes_in  = ["Monthly restock", "Emergency order", "Bulk purchase", "Supplier delivery", "Scheduled replenishment"]
    notes_out = ["Customer order #", "Internal use", "Sales order", "Damage write-off", "Sample dispatch"]

    txn_count = 0
    while txn_count < 30:
        for prod in product_objs:
            if txn_count >= 30:
                break

            # Alternate IN / OUT to keep things realistic
            txn_type = "IN" if txn_count % 2 == 0 else "OUT"
            max_qty  = min(20, prod.quantity) if txn_type == "OUT" else 30
            qty      = random.randint(1, max(1, max_qty))

            if txn_type == "OUT" and qty > prod.quantity:
                txn_type = "IN"   # flip to IN if not enough stock

            note = (
                random.choice(notes_in)
                if txn_type == "IN"
                else random.choice(notes_out) + str(random.randint(1000, 9999))
            )

            txn = Transaction(
                product_id=prod.id,
                type=txn_type,
                quantity=qty,
                note=note,
                created_at=_random_date(30),
            )
            db.add(txn)
            txn_count += 1

    db.commit()
    print(
        f"✅  Seeded: {len(user_objs)} users, {len(cat_objs)} categories, "
        f"{len(sup_objs)} suppliers, {len(product_objs)} products, "
        f"{txn_count} transactions."
    )
