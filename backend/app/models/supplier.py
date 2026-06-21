"""Supplier ORM model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(150), nullable=False, index=True)
    contact_name = Column(String(100), nullable=True)
    email        = Column(String(255), nullable=True)
    phone        = Column(String(30),  nullable=True)
    address      = Column(Text,        nullable=True)
    country      = Column(String(100), nullable=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One supplier → many products
    products = relationship("Product", back_populates="supplier", lazy="dynamic")

    def __repr__(self):
        return f"<Supplier id={self.id} name={self.name!r}>"
