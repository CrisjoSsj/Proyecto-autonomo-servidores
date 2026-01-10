"""
Modelo de Tokens Revocados (Blacklist)
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class RevokedToken(Base):
    """Blacklist de tokens revocados"""
    
    __tablename__ = "revoked_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(255), unique=True, index=True, nullable=False)  # JWT ID
    token_type = Column(String(20), nullable=False)  # 'access' o 'refresh'
    revoked_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)  # Para limpieza
    reason = Column(String(100), nullable=True)  # Razón de revocación
    
    def __repr__(self):
        return f"<RevokedToken(id={self.id}, jti='{self.jti}', type='{self.token_type}')>"
