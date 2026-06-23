"""Category ORM model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id          = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name        = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    products = relationship(
        "Product",
        back_populates="category",
        lazy="select",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Category id={self.id} name={self.name!r}>"
