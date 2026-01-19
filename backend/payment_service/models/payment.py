"""
Modelo de Pago
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.sql import func
from database import Base
import enum


class PaymentStatus(str, enum.Enum):
    """Estados de un pago"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class Payment(Base):
    """Modelo de pago en la base de datos"""
    
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String(100), unique=True, index=True, nullable=False)  # ID externo
    user_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default=PaymentStatus.PENDING.value)
    provider = Column(String(20), nullable=False)  # mock, stripe, mercadopago
    provider_payment_id = Column(String(200), nullable=True)  # ID del proveedor
    description = Column(String(255), nullable=True)
    metadata_json = Column(String(1000), nullable=True)  # JSON string de metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Payment(id={self.id}, payment_id='{self.payment_id}', status='{self.status}')>"
