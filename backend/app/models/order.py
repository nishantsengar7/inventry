from sqlalchemy import (Column, Integer, Float,
  String, DateTime, ForeignKey, Text)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Order(Base):
  __tablename__ = "orders"
  
  id = Column(Integer, primary_key=True,
              index=True)
  customer_id = Column(Integer,
    ForeignKey("customers.id",
               ondelete="SET NULL"),
    nullable=True)
  status = Column(String(20),
                  default="pending",
                  nullable=False)
  total_amount = Column(Float,
                        default=0.0)
  notes = Column(String(500),
                 nullable=True)
  created_at = Column(
    DateTime(timezone=True),
    server_default=func.now())
  updated_at = Column(
    DateTime(timezone=True),
    onupdate=func.now())
  
  customer = relationship("Customer",
    back_populates="orders")
  order_items = relationship("OrderItem",
    back_populates="order",
    cascade="all, delete-orphan")

class OrderItem(Base):
  __tablename__ = "order_items"
  
  id = Column(Integer, primary_key=True,
              index=True)
  order_id = Column(Integer,
    ForeignKey("orders.id",
               ondelete="CASCADE"),
    nullable=False)
  product_id = Column(Integer,
    ForeignKey("products.id",
               ondelete="SET NULL"),
    nullable=True)
  quantity = Column(Integer,
                    nullable=False)
  unit_price = Column(Float,
                      nullable=False)
  subtotal = Column(Float,
                    nullable=False)
  
  order = relationship("Order",
    back_populates="order_items")
  product = relationship("Product",
    back_populates="order_items")
