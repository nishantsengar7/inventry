"""Transaction ORM model – records every stock movement."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Enum,
    DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class TransactionType(str, enum.Enum):
    IN  = "IN"   # stock received
    OUT = "OUT"  # stock dispatched


class Transaction(Base):
    __tablename__ = "transactions"

    id           = Column(Integer, primary_key=True, index=True)
    type         = Column(Enum(TransactionType), nullable=False)
    quantity     = Column(Integer, nullable=False)
    note         = Column(Text, nullable=True)
    product_id   = Column(Integer, ForeignKey("products.id"),  nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"),     nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    product = relationship("Product", back_populates="transactions")
    user    = relationship("User")

    def __repr__(self):
        return (
            f"<Transaction id={self.id} type={self.type.value} "
            f"qty={self.quantity} product_id={self.product_id}>"
        )
