"""
Modelo de Partner (para webhooks B2B)
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Partner(Base):
    """
    Modelo de Partner para webhooks bidireccionales
    
    Almacena información de otros grupos/sistemas que se integran
    con nuestro sistema de pagos y reservas.
    """
    
    __tablename__ = "partners"
    
    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(String(50), unique=True, index=True, nullable=False)  # partner_abc123
    partner_name = Column(String(100), nullable=False)  # Nombre del partner
    webhook_url = Column(String(500), nullable=False)  # URL del webhook
    shared_secret = Column(String(100), nullable=False)  # Secret para HMAC
    
    # Eventos suscritos (JSON array como string)
    subscribed_events = Column(Text, nullable=False)  # ["reservation.confirmed", "payment.success"]
    
    # Contacto
    contact_email = Column(String(100), nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True)
    
    # Estadísticas
    webhook_success_count = Column(Integer, default=0)
    webhook_failure_count = Column(Integer, default=0)
    last_webhook_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Partner(id={self.id}, name='{self.partner_name}', active={self.is_active})>"
