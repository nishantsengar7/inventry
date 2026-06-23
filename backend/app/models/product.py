"""Product ORM model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint(
            'quantity >= 0',
            name='quantity_non_negative'
        ),
    )

    id          = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name        = Column(String(150), nullable=False, index=True)
    sku         = Column(String(50),  unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    price       = Column(Float, nullable=False)
    quantity    = Column(Integer, default=0, nullable=False)
    threshold   = Column(Integer, default=10, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id",  ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    category     = relationship("Category",    back_populates="products")
    supplier     = relationship("Supplier",    back_populates="products")
    transactions = relationship(
        "Transaction",
        back_populates="product",
        lazy="select",
        cascade="all, delete-orphan",
    )
    order_items = relationship("OrderItem", back_populates="product")

    @property
    def is_low_stock(self) -> bool:
        return self.quantity <= self.threshold

    def __repr__(self):
        return f"<Product id={self.id} sku={self.sku!r} qty={self.quantity}>"
