"""User ORM model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name       = Column(String(100), nullable=False)
    email      = Column(String(150), unique=True, nullable=False, index=True)
    password   = Column(String(255), nullable=False)
    role       = Column(String(20), default="viewer", nullable=False)
    is_active  = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"
