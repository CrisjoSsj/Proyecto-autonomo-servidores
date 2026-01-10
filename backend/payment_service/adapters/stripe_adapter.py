"""
Stripe Adapter - Integración con Stripe
"""
import stripe
from typing import Optional, Dict, Any

from .base import PaymentProvider, PaymentResult, PaymentStatus, WebhookEvent
from config import get_settings

settings = get_settings()


class StripeAdapter(PaymentProvider):
    """
    Adapter para Stripe
    
    Requiere STRIPE_SECRET_KEY configurado.
    Para webhooks, también requiere STRIPE_WEBHOOK_SECRET.
    """
    
    def __init__(self):
        stripe.api_key = settings.stripe_secret_key
        self._webhook_secret = settings.stripe_webhook_secret
    
    @property
    def provider_name(self) -> str:
        return "stripe"
    
    def _map_stripe_status(self, stripe_status: str) -> PaymentStatus:
        """Mapea estado de Stripe a nuestro enum"""
        mapping = {
            "requires_payment_method": PaymentStatus.PENDING,
            "requires_confirmation": PaymentStatus.PENDING,
            "requires_action": PaymentStatus.PENDING,
            "processing": PaymentStatus.PROCESSING,
            "requires_capture": PaymentStatus.PROCESSING,
            "succeeded": PaymentStatus.COMPLETED,
            "canceled": PaymentStatus.CANCELLED,
        }
        return mapping.get(stripe_status, PaymentStatus.FAILED)
    
    async def create_payment(
        self,
        amount: float,
        currency: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PaymentResult:
        """Crea un PaymentIntent en Stripe"""
        
        try:
            # Stripe usa centavos
            amount_cents = int(amount * 100)
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                description=description,
                metadata=metadata or {},
                automatic_payment_methods={"enabled": True}
            )
            
            return PaymentResult(
                success=True,
                payment_id=payment_intent.id,
                provider_payment_id=payment_intent.id,
                status=self._map_stripe_status(payment_intent.status),
                message="PaymentIntent creado",
                metadata={
                    "client_secret": payment_intent.client_secret
                }
            )
            
        except stripe.error.StripeError as e:
            return PaymentResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                message=str(e)
            )
    
    async def get_payment_status(self, payment_id: str) -> PaymentResult:
        """Obtiene estado de un PaymentIntent"""
        
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_id)
            
            return PaymentResult(
                success=True,
                payment_id=payment_id,
                provider_payment_id=payment_intent.id,
                status=self._map_stripe_status(payment_intent.status),
                metadata=dict(payment_intent.metadata)
            )
            
        except stripe.error.StripeError as e:
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message=str(e)
            )
    
    async def refund_payment(
        self,
        payment_id: str,
        amount: Optional[float] = None
    ) -> PaymentResult:
        """Crea un reembolso en Stripe"""
        
        try:
            refund_params = {"payment_intent": payment_id}
            if amount:
                refund_params["amount"] = int(amount * 100)
            
            refund = stripe.Refund.create(**refund_params)
            
            return PaymentResult(
                success=True,
                payment_id=payment_id,
                provider_payment_id=refund.id,
                status=PaymentStatus.REFUNDED,
                message="Reembolso procesado"
            )
            
        except stripe.error.StripeError as e:
            return PaymentResult(
                success=False,
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                message=str(e)
            )
    
    async def verify_webhook(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """Verifica firma de webhook de Stripe"""
        
        try:
            stripe.Webhook.construct_event(
                payload,
                signature,
                self._webhook_secret
            )
            return True
        except Exception:
            return False
    
    async def parse_webhook(
        self,
        payload: bytes
    ) -> Optional[WebhookEvent]:
        """Parsea webhook de Stripe a formato normalizado"""
        
        try:
            event = stripe.Event.construct_from(
                stripe.util.json.loads(payload),
                stripe.api_key
            )
            
            # Mapear tipos de evento de Stripe
            event_type_map = {
                "payment_intent.succeeded": "payment.success",
                "payment_intent.payment_failed": "payment.failed",
                "charge.refunded": "payment.refunded",
            }
            
            normalized_type = event_type_map.get(event.type, event.type)
            
            # Extraer datos del objeto
            obj = event.data.object
            
            return WebhookEvent(
                event_type=normalized_type,
                payment_id=obj.id,
                provider_payment_id=obj.id,
                status=self._map_stripe_status(getattr(obj, "status", "unknown")),
                amount=getattr(obj, "amount", 0) / 100,
                currency=getattr(obj, "currency", "usd").upper(),
                metadata=dict(getattr(obj, "metadata", {})),
                raw_payload=event.to_dict()
            )
            
        except Exception:
            return None
