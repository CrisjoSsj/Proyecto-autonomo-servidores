"""
Interface base para Payment Providers
Patrón Adapter - Define el contrato que deben implementar todos los adapters
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any
from enum import Enum


class PaymentStatus(str, Enum):
    """Estados posibles de un pago"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


@dataclass
class PaymentResult:
    """Resultado normalizado de una operación de pago"""
    success: bool
    payment_id: str
    provider_payment_id: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING
    message: Optional[str] = None
    redirect_url: Optional[str] = None  # Para pagos que requieren redirección
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class WebhookEvent:
    """Evento normalizado de webhook"""
    event_type: str  # payment.success, payment.failed, etc.
    payment_id: str
    provider_payment_id: str
    status: PaymentStatus
    amount: float
    currency: str
    metadata: Optional[Dict[str, Any]] = None
    raw_payload: Optional[Dict[str, Any]] = None


class PaymentProvider(ABC):
    """
    Interface abstracta para proveedores de pago
    
    Todos los adapters deben implementar estos métodos
    para garantizar interoperabilidad.
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Nombre del proveedor (mock, stripe, mercadopago)"""
        pass
    
    @abstractmethod
    async def create_payment(
        self,
        amount: float,
        currency: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        """
        Crea un nuevo pago
        
        Args:
            amount: Monto del pago
            currency: Moneda (USD, EUR, etc.)
            description: Descripción del pago
            metadata: Datos adicionales
            
        Returns:
            PaymentResult con estado del pago
        """
        pass
    
    @abstractmethod
    async def get_payment_status(self, payment_id: str) -> PaymentResult:
        """
        Obtiene el estado de un pago
        
        Args:
            payment_id: ID del pago
            
        Returns:
            PaymentResult con estado actual
        """
        pass
    
    @abstractmethod
    async def refund_payment(
        self,
        payment_id: str,
        amount: Optional[float] = None
    ) -> PaymentResult:
        """
        Reembolsa un pago
        
        Args:
            payment_id: ID del pago a reembolsar
            amount: Monto a reembolsar (None = total)
            
        Returns:
            PaymentResult con estado del reembolso
        """
        pass
    
    @abstractmethod
    async def verify_webhook(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """
        Verifica la firma de un webhook
        
        Args:
            payload: Cuerpo del webhook
            signature: Firma del webhook
            
        Returns:
            True si la firma es válida
        """
        pass
    
    @abstractmethod
    async def parse_webhook(
        self,
        payload: bytes
    ) -> Optional[WebhookEvent]:
        """
        Parsea un webhook a formato normalizado
        
        Args:
            payload: Cuerpo del webhook
            
        Returns:
            WebhookEvent normalizado o None
        """
        pass
