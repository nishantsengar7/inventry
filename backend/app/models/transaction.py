"""Transaction ORM model – records every stock IN/OUT movement."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id         = Column(Integer, primary_key=True, autoincrement=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    type       = Column(String(10), nullable=False)
    quantity   = Column(Integer, nullable=False)
    note       = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    product = relationship("Product", back_populates="transactions")

    def __repr__(self):
        return (
            f"<Transaction id={self.id} type={self.type!r} "
            f"qty={self.quantity} product_id={self.product_id}>"
        )
