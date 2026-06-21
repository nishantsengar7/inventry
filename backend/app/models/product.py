"""Product ORM model."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Numeric,
    Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id              = Column(Integer, primary_key=True, index=True)
    sku             = Column(String(100), unique=True, nullable=False, index=True)
    name            = Column(String(200), nullable=False, index=True)
    description     = Column(Text, nullable=True)
    price           = Column(Numeric(12, 2), nullable=False, default=0)
    quantity        = Column(Integer, default=0, nullable=False)
    reorder_level   = Column(Integer, default=10, nullable=False)  # low-stock threshold
    unit            = Column(String(30), default="pcs", nullable=True)
    image_url       = Column(String(500), nullable=True)
    is_active       = Column(Boolean, default=True)
    category_id     = Column(Integer, ForeignKey("categories.id"), nullable=True)
    supplier_id     = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category     = relationship("Category",    back_populates="products")
    supplier     = relationship("Supplier",    back_populates="products")
    transactions = relationship("Transaction", back_populates="product", lazy="dynamic")

    @property
    def stock_status(self) -> str:
        if self.quantity <= 0:
            return "Out of Stock"
        if self.quantity <= self.reorder_level:
            return "Low Stock"
        return "In Stock"

    def __repr__(self):
        return f"<Product id={self.id} sku={self.sku!r} qty={self.quantity}>"
