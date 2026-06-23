"""Supplier ORM model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id         = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name       = Column(String(100), nullable=False, index=True)
    email      = Column(String(150), nullable=True)
    phone      = Column(String(20),  nullable=True)
    address    = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    products = relationship(
        "Product",
        back_populates="supplier",
        lazy="select",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Supplier id={self.id} name={self.name!r}>"
