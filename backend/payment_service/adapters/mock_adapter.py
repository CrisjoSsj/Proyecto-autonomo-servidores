"""
Mock Adapter - Simulador de pagos para desarrollo
"""
import uuid
import json
import hmac
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from .base import PaymentProvider, PaymentResult, PaymentStatus, WebhookEvent


class MockAdapter(PaymentProvider):
    """
    Adapter de pruebas que simula pagos
    
    Útil para desarrollo sin necesidad de conectar a Stripe.
    Simula diferentes escenarios basados en el monto:
    - amount < 1: Falla
    - amount >= 1 y < 100: Éxito inmediato
    - amount >= 100: Requiere confirmación (pending)
    """
    
    def __init__(self, webhook_secret: str = "mock_secret"):
        self._webhook_secret = webhook_secret
        self._payments: Dict[str, dict] = {}  # Almacén en memoria
    
    @property
    def provider_name(self) -> str:
        return "mock"
    
    async def create_payment(
        self,
        amount: float,
        currency: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        """Crea un pago simulado"""
        
        payment_id = f"pay_{uuid.uuid4().hex[:16]}"
        provider_id = f"mock_{uuid.uuid4().hex[:12]}"
        
        # Simular diferentes escenarios
        if amount < 1:
            status = PaymentStatus.FAILED
            message = "Monto mínimo es $1.00"
            success = False
        elif amount >= 100:
            status = PaymentStatus.PENDING
            message = "Pago pendiente de confirmación"
            success = True
        else:
            status = PaymentStatus.COMPLETED
            message = "Pago completado exitosamente"
            success = True
        
        # Almacenar pago
        self._payments[payment_id] = {
            "payment_id": payment_id,
            "provider_payment_id": provider_id,
            "amount": amount,
            "currency": currency,
            "description": description,
            "status": status.value,
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return PaymentResult(
            success=success,
            payment_id=payment_id,
            provider_payment_id=provider_id,
            status=status,
            message=message,
            metadata=metadata
        )
    
    async def get_payment_status(self, payment_id: str) -> PaymentResult:
        """Obtiene estado de un pago simulado"""
        
        if payment_id not in self._payments:
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message="Pago no encontrado"
            )
        
        payment = self._payments[payment_id]
        
        return PaymentResult(
            success=True,
            payment_id=payment_id,
            provider_payment_id=payment["provider_payment_id"],
            status=PaymentStatus(payment["status"]),
            metadata=payment.get("metadata")
        )
    
    async def refund_payment(
        self,
        payment_id: str,
        amount: Optional[float] = None
    ) -> PaymentResult:
        """Simula reembolso"""
        
        if payment_id not in self._payments:
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message="Pago no encontrado"
            )
        
        payment = self._payments[payment_id]
        
        if payment["status"] != PaymentStatus.COMPLETED.value:
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus(payment["status"]),
                message="Solo se pueden reembolsar pagos completados"
            )
        
        payment["status"] = PaymentStatus.REFUNDED.value
        
        return PaymentResult(
            success=True,
            payment_id=payment_id,
            provider_payment_id=payment["provider_payment_id"],
            status=PaymentStatus.REFUNDED,
            message="Reembolso procesado"
        )
    
    async def verify_webhook(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """Verifica firma de webhook mock"""
        
        expected = hmac.new(
            self._webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected)
    
    async def parse_webhook(
        self,
        payload: bytes
    ) -> Optional[WebhookEvent]:
        """Parsea webhook mock"""
        
        try:
            data = json.loads(payload.decode())
            
            return WebhookEvent(
                event_type=data.get("event_type", "payment.unknown"),
                payment_id=data.get("payment_id", ""),
                provider_payment_id=data.get("provider_payment_id", ""),
                status=PaymentStatus(data.get("status", "pending")),
                amount=data.get("amount", 0.0),
                currency=data.get("currency", "USD"),
                metadata=data.get("metadata"),
                raw_payload=data
            )
        except Exception:
            return None
    
    def create_test_webhook(
        self,
        payment_id: str,
        event_type: str = "payment.success"
    ) -> tuple:
        """
        Crea un webhook de prueba firmado
        
        Returns:
            Tuple de (payload_bytes, signature)
        """
        if payment_id in self._payments:
            payment = self._payments[payment_id]
        else:
            payment = {
                "payment_id": payment_id,
                "amount": 50.0,
                "currency": "USD"
            }
        
        payload = {
            "event_type": event_type,
            "payment_id": payment_id,
            "provider_payment_id": payment.get("provider_payment_id", "mock_test"),
            "status": "completed" if event_type == "payment.success" else "failed",
            "amount": payment.get("amount", 0),
            "currency": payment.get("currency", "USD"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        payload_bytes = json.dumps(payload).encode()
        signature = hmac.new(
            self._webhook_secret.encode(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        
        return payload_bytes, signature
