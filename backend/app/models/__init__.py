# models/__init__.py
# Import all models here so that Base.metadata.create_all() picks them up.
from .user        import User
from .category    import Category
from .supplier    import Supplier
from .product     import Product
from .transaction import Transaction
