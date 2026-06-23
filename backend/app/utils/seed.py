"""
seed.py – Populate the database with realistic demo data.

Called once on application startup when the users table is empty.
Creates: 2 users, 5 categories, 5 suppliers, 15 products, 60 transactions.

Products use Indian Rupee (₹) pricing.
Transactions span the last 45 days with realistic patterns and anomalies.
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

USERS = [
    {"name": "Admin User",  "email": "admin@demo.com",  "password": "admin123",  "role": "admin"},
    {"name": "Viewer User", "email": "viewer@demo.com", "password": "viewer123", "role": "viewer"},
]

CATEGORIES = [
    {"name": "Electronics",      "description": "Electronic devices, components, and accessories"},
    {"name": "Clothing",         "description": "Apparel, footwear, and fashion accessories"},
    {"name": "Food & Beverages", "description": "Packaged food, drinks, and consumables"},
    {"name": "Office Supplies",  "description": "Stationery, printers, and desk accessories"},
    {"name": "Tools & Hardware", "description": "Hand tools, power tools, and hardware"},
]

SUPPLIERS = [
    {"name": "TechCorp",    "email": "orders@techcorp.in",     "phone": "+91-98765-43210", "address": "204 Silicon Hub, Whitefield, Bengaluru 560066"},
    {"name": "FashionHub",  "email": "supply@fashionhub.in",   "phone": "+91-98765-43211", "address": "56 Style Market, Linking Road, Mumbai 400050"},
    {"name": "FreshFoods",  "email": "bulk@freshfoods.in",     "phone": "+91-98765-43212", "address": "12 APMC Yard, Vashi, Navi Mumbai 400703"},
    {"name": "OfficeWorld", "email": "b2b@officeworld.in",     "phone": "+91-98765-43213", "address": "88 Connaught Place, New Delhi 110001"},
    {"name": "ToolMaster",  "email": "trade@toolmaster.in",    "phone": "+91-98765-43214", "address": "17 Industrial Estate, Peenya, Bengaluru 560058"},
]

PRODUCTS = [

    ("iPhone 15 Case",       "ELEC-001", "Shock-proof TPU case for iPhone 15, pack of 1",      299,   45,  10, 0, 0),
    ("USB-C Cable 2m",       "ELEC-002", "Braided USB-C to USB-C cable, 100W fast charge",     199,   8,   15, 0, 0),
    ("Wireless Mouse",       "ELEC-003", "2.4GHz ergonomic wireless mouse, DPI adjustable",    899,   0,    5, 0, 0),
    ("Laptop Stand",         "ELEC-004", "Foldable aluminium laptop stand, adjustable height", 1299,  22,   8, 0, 0),

    ("Cotton T-Shirt M",     "CLTH-001", "100% cotton round-neck T-shirt, Medium, white",      499,   67,  20, 1, 1),
    ("Formal Trousers",      "CLTH-002", "Slim-fit formal trousers, 32W, grey",               1299,   4,   10, 1, 1),
    ("Winter Jacket",        "CLTH-003", "Waterproof hooded jacket, unisex, navy",            2999,   15,   5, 1, 1),

    ("Green Tea 100pcs",     "FOOD-001", "Premium green tea bags, 100 count box",              299,   33,  10, 2, 2),
    ("Protein Bar Pack",     "FOOD-002", "Whey protein bars, assorted flavours, 6-pack",       599,   2,   15, 2, 2),
    ("Mineral Water 24pk",   "FOOD-003", "Natural mineral water 500ml, 24-bottle pack",        399,   55,  20, 2, 2),

    ("A4 Paper Ream",        "OFFC-001", "80gsm white A4 printing paper, 500 sheets",          299,   18,  25, 3, 3),
    ("Blue Ballpen 12pk",    "OFFC-002", "0.7mm smooth-write blue ballpoint pens, 12-pack",     99,   44,  10, 3, 3),
    ("Stapler Heavy Duty",   "OFFC-003", "40-sheet capacity metal stapler with staples box",   399,   9,    5, 3, 3),

    ("Cordless Drill",       "TOOL-001", "18V brushless cordless drill, 2 batteries + case",  3999,   7,    3, 4, 4),
    ("Measuring Tape 5m",    "TOOL-002", "Auto-lock steel tape measure, magnetic tip, 5m",     199,   28,  10, 4, 4),
]

OUT_QTY_RANGES = {
    0: (1, 5),
    1: (1, 8),
    2: (5, 20),
    3: (2, 10),
    4: (1, 3),
}

IN_NOTES  = [
    "Monthly restock from supplier",
    "Emergency order — stock running low",
    "Bulk purchase — quarterly order",
    "Supplier delivery received",
    "Scheduled replenishment",
    "Return from customer — restocked",
    "Transfer from warehouse B",
]
OUT_NOTES = [
    "Customer order #",
    "Sales order #",
    "B2B dispatch #",
    "Retail sale #",
    "Online order #",
    "Corporate purchase #",
]

def _random_date(days_back: int, min_days_back: int = 0) -> datetime:
    """Return a random datetime within the given day range."""
    range_seconds = (days_back - min_days_back) * 24 * 3600
    offset = random.randint(0, range_seconds) + min_days_back * 3600
    return datetime.utcnow() - timedelta(seconds=offset)

def seed_database(db: Session) -> None:
    """
    Populate the database with demo data.
    Safe to call multiple times – skips if users table already has rows.
    """

    if db.query(User).count() > 0:
        print("[SKIP] Seed skipped - data already exists.")
        return

    print("[SEED] Seeding demo data...")

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

    cat_objs = []
    for c in CATEGORIES:
        cat = Category(name=c["name"], description=c["description"])
        db.add(cat)
        cat_objs.append(cat)
    db.flush()

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

    product_objs = []
    for (name, sku, desc, price, qty, threshold, cat_i, sup_i) in PRODUCTS:
        prod = Product(
            name=name,
            sku=sku,
            description=desc,
            price=float(price),
            quantity=qty,
            threshold=threshold,
            category_id=cat_objs[cat_i].id,
            supplier_id=sup_objs[sup_i].id,
        )
        db.add(prod)
        product_objs.append(prod)
    db.flush()

    txn_count = 0
    txns = []

    for round_num in range(4):
        for prod_idx, prod in enumerate(product_objs):
            if txn_count >= 60:
                break

            cat_i = PRODUCTS[prod_idx][6]
            out_min, out_max = OUT_QTY_RANGES[cat_i]

            if round_num == 0:
                txn_type = "IN"
            elif prod_idx % 3 == 0:
                txn_type = "IN"
            else:
                txn_type = "OUT"

            if prod_idx == 8 and round_num == 2:
                txn_type = "OUT"
                qty = 30
            elif prod_idx == 0 and round_num == 2:
                txn_type = "IN"
                qty = 100
            elif txn_type == "OUT":
                qty = random.randint(out_min, out_max)

                max_possible = PRODUCTS[prod_idx][4]
                qty = min(qty, max(1, max_possible - 1))
            else:
                qty = random.randint(5, 50)

            if txn_type == "OUT":
                note = random.choice(OUT_NOTES) + str(random.randint(10000, 99999))
            else:
                note = random.choice(IN_NOTES)

            days_range_start = 45 - round_num * 10
            days_range_end   = max(1, days_range_start - 12)
            txn_date = _random_date(days_range_start, days_range_end)

            txns.append(Transaction(
                product_id=prod.id,
                type=txn_type,
                quantity=qty,
                note=note,
                created_at=txn_date,
            ))
            txn_count += 1

    txns.sort(key=lambda t: t.created_at)
    for t in txns:
        db.add(t)

    db.commit()
    print(
        f"[OK] Seeded: {len(user_objs)} users, {len(cat_objs)} categories, "
        f"{len(sup_objs)} suppliers, {len(product_objs)} products, "
        f"{txn_count} transactions."
    )
