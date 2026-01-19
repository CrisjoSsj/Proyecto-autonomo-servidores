"""
Payment Service - Patrón Adapter para Pasarelas de Pago
=========================================================
Pilar 2: Webhooks e Interoperabilidad B2B

Este módulo implementa:
- PaymentProvider: Interface abstracta (contrato común)
- MockAdapter: Adaptador de pruebas (obligatorio)
- StripeAdapter: Adaptador para Stripe
- MercadoPagoAdapter: Adaptador para MercadoPago (opcional)
- PaymentService: Servicio principal que usa los adapters

Patrón de diseño: Adapter (GoF)
- Permite intercambiar pasarelas de pago sin modificar el código cliente
- Normaliza las respuestas de todas las pasarelas
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any
from enum import Enum
from decimal import Decimal
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


# ============================================================================
# DATACLASSES Y ENUMS
# ============================================================================

class PaymentStatus(Enum):
    """Estados normalizados de pago"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentEvent(Enum):
    """Eventos normalizados de pago"""
    PAYMENT_PENDING = "payment.pending"
    PAYMENT_SUCCESS = "payment.success"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_REFUNDED = "payment.refunded"
    PAYMENT_CANCELLED = "payment.cancelled"


@dataclass
class PaymentRequest:
    """Request normalizado para crear un pago"""
    amount: Decimal
    currency: str
    reference_id: str  # ID interno (ej: reserva_id)
    description: str
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    return_url: Optional[str] = None
    cancel_url: Optional[str] = None


@dataclass
class PaymentResponse:
    """
    Response normalizado de pago.
    Este es el formato común para todas las pasarelas.
    
    Formato del contrato:
    {
        "event": "payment.success",
        "provider": "stripe | mock | mercadopago",
        "referenceId": "string",
        "amount": number,
        "currency": "USD",
        "metadata": {}
    }
    """
    event: PaymentEvent
    provider: str
    reference_id: str
    transaction_id: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    metadata: Dict[str, Any]
    
    # URLs opcionales para pasarelas con redirect
    payment_url: Optional[str] = None
    
    # Datos adicionales
    raw_response: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convierte a diccionario con formato normalizado"""
        return {
            "event": self.event.value,
            "provider": self.provider,
            "referenceId": self.reference_id,
            "transactionId": self.transaction_id,
            "amount": float(self.amount),
            "currency": self.currency,
            "status": self.status.value,
            "metadata": self.metadata,
            "paymentUrl": self.payment_url,
            "errorMessage": self.error_message,
        }


@dataclass
class WebhookPayload:
    """Payload normalizado de webhook de pasarela"""
    event: PaymentEvent
    provider: str
    reference_id: str
    transaction_id: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    metadata: Dict[str, Any]
    raw_data: Dict[str, Any]
    timestamp: datetime


# ============================================================================
# INTERFACE ABSTRACTA - PaymentProvider
# ============================================================================

class PaymentProvider(ABC):
    """
    Interface abstracta para proveedores de pago.
    Define el contrato común que todos los adapters deben implementar.
    
    Métodos requeridos:
    - create_payment(): Crear un nuevo pago
    - confirm_payment(): Confirmar un pago pendiente
    - handle_webhook(): Procesar webhook de la pasarela
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Nombre identificador del proveedor"""
        pass
    
    @abstractmethod
    def create_payment(self, request: PaymentRequest) -> PaymentResponse:
        """
        Crea un nuevo pago en la pasarela.
        
        Args:
            request: Datos del pago a crear
            
        Returns:
            PaymentResponse normalizado
        """
        pass
    
    @abstractmethod
    def confirm_payment(self, transaction_id: str) -> PaymentResponse:
        """
        Confirma un pago pendiente.
        
        Args:
            transaction_id: ID de la transacción en la pasarela
            
        Returns:
            PaymentResponse con el estado actualizado
        """
        pass
    
    @abstractmethod
    def handle_webhook(self, payload: Dict[str, Any], signature: str) -> WebhookPayload:
        """
        Procesa un webhook recibido de la pasarela.
        Valida la firma y normaliza los datos.
        
        Args:
            payload: Datos crudos del webhook
            signature: Firma del header para validación
            
        Returns:
            WebhookPayload normalizado
            
        Raises:
            ValueError: Si la firma es inválida
        """
        pass
    
    @abstractmethod
    def refund_payment(self, transaction_id: str, amount: Optional[Decimal] = None) -> PaymentResponse:
        """
        Procesa un reembolso.
        
        Args:
            transaction_id: ID de la transacción
            amount: Monto a reembolsar (None = reembolso total)
            
        Returns:
            PaymentResponse con el resultado
        """
        pass


# ============================================================================
# MOCK ADAPTER - Para desarrollo y pruebas
# ============================================================================

class MockPaymentAdapter(PaymentProvider):
    """
    Adaptador Mock para testing y desarrollo.
    Simula comportamiento de una pasarela real sin hacer llamadas externas.
    
    Uso:
        adapter = MockPaymentAdapter()
        response = adapter.create_payment(request)
    """
    
    def __init__(self, simulate_failure: bool = False):
        """
        Args:
            simulate_failure: Si True, simula pagos fallidos
        """
        self._simulate_failure = simulate_failure
        self._payments: Dict[str, dict] = {}
    
    @property
    def provider_name(self) -> str:
        return "mock"
    
    def create_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Simula la creación de un pago"""
        transaction_id = f"mock_{uuid.uuid4().hex[:12]}"
        
        if self._simulate_failure:
            logger.info(f"[MockAdapter] Simulando pago fallido: {transaction_id}")
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id=request.reference_id,
                transaction_id=transaction_id,
                amount=request.amount,
                currency=request.currency,
                status=PaymentStatus.FAILED,
                metadata=request.metadata or {},
                error_message="Pago simulado como fallido",
            )
        
        # Simular pago exitoso
        payment_data = {
            "transaction_id": transaction_id,
            "reference_id": request.reference_id,
            "amount": float(request.amount),
            "currency": request.currency,
            "status": PaymentStatus.COMPLETED.value,
            "customer_email": request.customer_email,
            "customer_name": request.customer_name,
            "metadata": request.metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }
        
        self._payments[transaction_id] = payment_data
        logger.info(f"[MockAdapter] Pago creado: {transaction_id}")
        
        return PaymentResponse(
            event=PaymentEvent.PAYMENT_SUCCESS,
            provider=self.provider_name,
            reference_id=request.reference_id,
            transaction_id=transaction_id,
            amount=request.amount,
            currency=request.currency,
            status=PaymentStatus.COMPLETED,
            metadata=request.metadata or {},
            raw_response=payment_data,
        )
    
    def confirm_payment(self, transaction_id: str) -> PaymentResponse:
        """Confirma un pago mock"""
        payment = self._payments.get(transaction_id)
        
        if not payment:
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id="unknown",
                transaction_id=transaction_id,
                amount=Decimal("0"),
                currency="USD",
                status=PaymentStatus.FAILED,
                metadata={},
                error_message="Transacción no encontrada",
            )
        
        return PaymentResponse(
            event=PaymentEvent.PAYMENT_SUCCESS,
            provider=self.provider_name,
            reference_id=payment["reference_id"],
            transaction_id=transaction_id,
            amount=Decimal(str(payment["amount"])),
            currency=payment["currency"],
            status=PaymentStatus.COMPLETED,
            metadata=payment["metadata"],
        )
    
    def handle_webhook(self, payload: Dict[str, Any], signature: str) -> WebhookPayload:
        """Procesa un webhook mock (sin validación de firma)"""
        # Mock no requiere validación de firma
        event_type = payload.get("event", "payment.success")
        
        event_mapping = {
            "payment.success": PaymentEvent.PAYMENT_SUCCESS,
            "payment.failed": PaymentEvent.PAYMENT_FAILED,
            "payment.refunded": PaymentEvent.PAYMENT_REFUNDED,
            "payment.cancelled": PaymentEvent.PAYMENT_CANCELLED,
        }
        
        status_mapping = {
            "payment.success": PaymentStatus.COMPLETED,
            "payment.failed": PaymentStatus.FAILED,
            "payment.refunded": PaymentStatus.REFUNDED,
            "payment.cancelled": PaymentStatus.CANCELLED,
        }
        
        return WebhookPayload(
            event=event_mapping.get(event_type, PaymentEvent.PAYMENT_PENDING),
            provider=self.provider_name,
            reference_id=payload.get("referenceId", ""),
            transaction_id=payload.get("transactionId", ""),
            amount=Decimal(str(payload.get("amount", 0))),
            currency=payload.get("currency", "USD"),
            status=status_mapping.get(event_type, PaymentStatus.PENDING),
            metadata=payload.get("metadata", {}),
            raw_data=payload,
            timestamp=datetime.utcnow(),
        )
    
    def refund_payment(self, transaction_id: str, amount: Optional[Decimal] = None) -> PaymentResponse:
        """Simula un reembolso"""
        payment = self._payments.get(transaction_id)
        
        if not payment:
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id="unknown",
                transaction_id=transaction_id,
                amount=Decimal("0"),
                currency="USD",
                status=PaymentStatus.FAILED,
                metadata={},
                error_message="Transacción no encontrada",
            )
        
        refund_amount = amount or Decimal(str(payment["amount"]))
        payment["status"] = PaymentStatus.REFUNDED.value
        payment["refunded_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"[MockAdapter] Reembolso procesado: {transaction_id} - ${refund_amount}")
        
        return PaymentResponse(
            event=PaymentEvent.PAYMENT_REFUNDED,
            provider=self.provider_name,
            reference_id=payment["reference_id"],
            transaction_id=transaction_id,
            amount=refund_amount,
            currency=payment["currency"],
            status=PaymentStatus.REFUNDED,
            metadata=payment["metadata"],
        )


# ============================================================================
# STRIPE ADAPTER
# ============================================================================

class StripePaymentAdapter(PaymentProvider):
    """
    Adaptador para Stripe.
    Requiere configuración de API keys en settings.
    
    Settings requeridos:
    - STRIPE_SECRET_KEY
    - STRIPE_WEBHOOK_SECRET
    """
    
    def __init__(self, secret_key: str = None, webhook_secret: str = None):
        from django.conf import settings
        
        self._secret_key = secret_key or getattr(settings, 'STRIPE_SECRET_KEY', '')
        self._webhook_secret = webhook_secret or getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
        self._stripe = None
        
        if self._secret_key:
            try:
                import stripe
                stripe.api_key = self._secret_key
                self._stripe = stripe
            except ImportError:
                logger.warning("Stripe library no instalada. Ejecutar: pip install stripe")
    
    @property
    def provider_name(self) -> str:
        return "stripe"
    
    def create_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Crea un PaymentIntent en Stripe"""
        if not self._stripe:
            return self._stripe_not_configured(request)
        
        try:
            payment_intent = self._stripe.PaymentIntent.create(
                amount=int(request.amount * 100),  # Stripe usa centavos
                currency=request.currency.lower(),
                description=request.description,
                metadata={
                    "reference_id": request.reference_id,
                    **(request.metadata or {}),
                },
                receipt_email=request.customer_email,
            )
            
            logger.info(f"[StripeAdapter] PaymentIntent creado: {payment_intent.id}")
            
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_PENDING,
                provider=self.provider_name,
                reference_id=request.reference_id,
                transaction_id=payment_intent.id,
                amount=request.amount,
                currency=request.currency,
                status=PaymentStatus.PENDING,
                metadata=request.metadata or {},
                payment_url=payment_intent.client_secret,  # Para Stripe Elements
                raw_response=dict(payment_intent),
            )
            
        except Exception as e:
            logger.error(f"[StripeAdapter] Error creando pago: {e}")
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id=request.reference_id,
                transaction_id="",
                amount=request.amount,
                currency=request.currency,
                status=PaymentStatus.FAILED,
                metadata=request.metadata or {},
                error_message=str(e),
            )
    
    def confirm_payment(self, transaction_id: str) -> PaymentResponse:
        """Confirma un PaymentIntent"""
        if not self._stripe:
            return self._stripe_not_configured_by_id(transaction_id)
        
        try:
            payment_intent = self._stripe.PaymentIntent.retrieve(transaction_id)
            
            status_mapping = {
                "succeeded": PaymentStatus.COMPLETED,
                "processing": PaymentStatus.PROCESSING,
                "requires_payment_method": PaymentStatus.PENDING,
                "canceled": PaymentStatus.CANCELLED,
            }
            
            event = PaymentEvent.PAYMENT_SUCCESS if payment_intent.status == "succeeded" else PaymentEvent.PAYMENT_PENDING
            
            return PaymentResponse(
                event=event,
                provider=self.provider_name,
                reference_id=payment_intent.metadata.get("reference_id", ""),
                transaction_id=transaction_id,
                amount=Decimal(payment_intent.amount) / 100,
                currency=payment_intent.currency.upper(),
                status=status_mapping.get(payment_intent.status, PaymentStatus.PENDING),
                metadata=dict(payment_intent.metadata),
                raw_response=dict(payment_intent),
            )
            
        except Exception as e:
            logger.error(f"[StripeAdapter] Error confirmando pago: {e}")
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id="",
                transaction_id=transaction_id,
                amount=Decimal("0"),
                currency="USD",
                status=PaymentStatus.FAILED,
                metadata={},
                error_message=str(e),
            )
    
    def handle_webhook(self, payload: Dict[str, Any], signature: str) -> WebhookPayload:
        """Valida y procesa un webhook de Stripe"""
        if not self._stripe:
            raise ValueError("Stripe no configurado")
        
        try:
            import json
            event = self._stripe.Webhook.construct_event(
                json.dumps(payload),
                signature,
                self._webhook_secret
            )
        except Exception as e:
            raise ValueError(f"Firma de webhook inválida: {e}")
        
        event_type = event.get("type", "")
        payment_object = event.get("data", {}).get("object", {})
        
        event_mapping = {
            "payment_intent.succeeded": PaymentEvent.PAYMENT_SUCCESS,
            "payment_intent.payment_failed": PaymentEvent.PAYMENT_FAILED,
            "payment_intent.canceled": PaymentEvent.PAYMENT_CANCELLED,
            "charge.refunded": PaymentEvent.PAYMENT_REFUNDED,
        }
        
        status_mapping = {
            "payment_intent.succeeded": PaymentStatus.COMPLETED,
            "payment_intent.payment_failed": PaymentStatus.FAILED,
            "payment_intent.canceled": PaymentStatus.CANCELLED,
            "charge.refunded": PaymentStatus.REFUNDED,
        }
        
        return WebhookPayload(
            event=event_mapping.get(event_type, PaymentEvent.PAYMENT_PENDING),
            provider=self.provider_name,
            reference_id=payment_object.get("metadata", {}).get("reference_id", ""),
            transaction_id=payment_object.get("id", ""),
            amount=Decimal(payment_object.get("amount", 0)) / 100,
            currency=payment_object.get("currency", "usd").upper(),
            status=status_mapping.get(event_type, PaymentStatus.PENDING),
            metadata=dict(payment_object.get("metadata", {})),
            raw_data=payload,
            timestamp=datetime.utcnow(),
        )
    
    def refund_payment(self, transaction_id: str, amount: Optional[Decimal] = None) -> PaymentResponse:
        """Procesa un reembolso en Stripe"""
        if not self._stripe:
            return self._stripe_not_configured_by_id(transaction_id)
        
        try:
            refund_params = {"payment_intent": transaction_id}
            if amount:
                refund_params["amount"] = int(amount * 100)
            
            refund = self._stripe.Refund.create(**refund_params)
            
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_REFUNDED,
                provider=self.provider_name,
                reference_id="",
                transaction_id=transaction_id,
                amount=Decimal(refund.amount) / 100,
                currency=refund.currency.upper(),
                status=PaymentStatus.REFUNDED,
                metadata={},
                raw_response=dict(refund),
            )
            
        except Exception as e:
            logger.error(f"[StripeAdapter] Error en reembolso: {e}")
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id="",
                transaction_id=transaction_id,
                amount=Decimal("0"),
                currency="USD",
                status=PaymentStatus.FAILED,
                metadata={},
                error_message=str(e),
            )
    
    def _stripe_not_configured(self, request: PaymentRequest) -> PaymentResponse:
        return PaymentResponse(
            event=PaymentEvent.PAYMENT_FAILED,
            provider=self.provider_name,
            reference_id=request.reference_id,
            transaction_id="",
            amount=request.amount,
            currency=request.currency,
            status=PaymentStatus.FAILED,
            metadata={},
            error_message="Stripe no configurado",
        )
    
    def _stripe_not_configured_by_id(self, transaction_id: str) -> PaymentResponse:
        return PaymentResponse(
            event=PaymentEvent.PAYMENT_FAILED,
            provider=self.provider_name,
            reference_id="",
            transaction_id=transaction_id,
            amount=Decimal("0"),
            currency="USD",
            status=PaymentStatus.FAILED,
            metadata={},
            error_message="Stripe no configurado",
        )


# ============================================================================
# MERCADOPAGO ADAPTER (Opcional)
# ============================================================================

class MercadoPagoPaymentAdapter(PaymentProvider):
    """
    Adaptador para MercadoPago.
    Requiere configuración de access token en settings.
    
    Settings requeridos:
    - MERCADOPAGO_ACCESS_TOKEN
    - MERCADOPAGO_WEBHOOK_SECRET (opcional)
    """
    
    def __init__(self, access_token: str = None):
        from django.conf import settings
        
        self._access_token = access_token or getattr(settings, 'MERCADOPAGO_ACCESS_TOKEN', '')
        self._sdk = None
        
        if self._access_token:
            try:
                import mercadopago
                self._sdk = mercadopago.SDK(self._access_token)
            except ImportError:
                logger.warning("MercadoPago library no instalada. Ejecutar: pip install mercadopago")
    
    @property
    def provider_name(self) -> str:
        return "mercadopago"
    
    def create_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Crea una preferencia de pago en MercadoPago"""
        if not self._sdk:
            return self._mp_not_configured(request)
        
        try:
            preference_data = {
                "items": [
                    {
                        "title": request.description,
                        "quantity": 1,
                        "unit_price": float(request.amount),
                        "currency_id": request.currency,
                    }
                ],
                "payer": {
                    "email": request.customer_email,
                },
                "external_reference": request.reference_id,
                "metadata": request.metadata or {},
                "back_urls": {
                    "success": request.return_url or "",
                    "failure": request.cancel_url or "",
                    "pending": request.return_url or "",
                },
            }
            
            preference_response = self._sdk.preference().create(preference_data)
            preference = preference_response.get("response", {})
            
            logger.info(f"[MercadoPagoAdapter] Preferencia creada: {preference.get('id')}")
            
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_PENDING,
                provider=self.provider_name,
                reference_id=request.reference_id,
                transaction_id=preference.get("id", ""),
                amount=request.amount,
                currency=request.currency,
                status=PaymentStatus.PENDING,
                metadata=request.metadata or {},
                payment_url=preference.get("init_point"),
                raw_response=preference,
            )
            
        except Exception as e:
            logger.error(f"[MercadoPagoAdapter] Error creando pago: {e}")
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id=request.reference_id,
                transaction_id="",
                amount=request.amount,
                currency=request.currency,
                status=PaymentStatus.FAILED,
                metadata={},
                error_message=str(e),
            )
    
    def confirm_payment(self, transaction_id: str) -> PaymentResponse:
        """Obtiene el estado de un pago en MercadoPago"""
        if not self._sdk:
            return self._mp_not_configured_by_id(transaction_id)
        
        try:
            payment_response = self._sdk.payment().get(transaction_id)
            payment = payment_response.get("response", {})
            
            status_mapping = {
                "approved": PaymentStatus.COMPLETED,
                "pending": PaymentStatus.PENDING,
                "in_process": PaymentStatus.PROCESSING,
                "rejected": PaymentStatus.FAILED,
                "refunded": PaymentStatus.REFUNDED,
                "cancelled": PaymentStatus.CANCELLED,
            }
            
            mp_status = payment.get("status", "pending")
            event = PaymentEvent.PAYMENT_SUCCESS if mp_status == "approved" else PaymentEvent.PAYMENT_PENDING
            
            return PaymentResponse(
                event=event,
                provider=self.provider_name,
                reference_id=payment.get("external_reference", ""),
                transaction_id=str(payment.get("id", "")),
                amount=Decimal(str(payment.get("transaction_amount", 0))),
                currency=payment.get("currency_id", "USD"),
                status=status_mapping.get(mp_status, PaymentStatus.PENDING),
                metadata=payment.get("metadata", {}),
                raw_response=payment,
            )
            
        except Exception as e:
            logger.error(f"[MercadoPagoAdapter] Error confirmando pago: {e}")
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id="",
                transaction_id=transaction_id,
                amount=Decimal("0"),
                currency="USD",
                status=PaymentStatus.FAILED,
                metadata={},
                error_message=str(e),
            )
    
    def handle_webhook(self, payload: Dict[str, Any], signature: str) -> WebhookPayload:
        """Procesa un webhook de MercadoPago"""
        # MercadoPago IPN no usa firma, pero se valida por IP o token
        action = payload.get("action", "")
        data = payload.get("data", {})
        payment_id = data.get("id")
        
        # Obtener detalles del pago
        if self._sdk and payment_id:
            payment_response = self._sdk.payment().get(payment_id)
            payment = payment_response.get("response", {})
        else:
            payment = data
        
        status_mapping = {
            "approved": PaymentStatus.COMPLETED,
            "pending": PaymentStatus.PENDING,
            "in_process": PaymentStatus.PROCESSING,
            "rejected": PaymentStatus.FAILED,
            "refunded": PaymentStatus.REFUNDED,
            "cancelled": PaymentStatus.CANCELLED,
        }
        
        mp_status = payment.get("status", "pending")
        
        event_mapping = {
            "approved": PaymentEvent.PAYMENT_SUCCESS,
            "rejected": PaymentEvent.PAYMENT_FAILED,
            "refunded": PaymentEvent.PAYMENT_REFUNDED,
            "cancelled": PaymentEvent.PAYMENT_CANCELLED,
        }
        
        return WebhookPayload(
            event=event_mapping.get(mp_status, PaymentEvent.PAYMENT_PENDING),
            provider=self.provider_name,
            reference_id=payment.get("external_reference", ""),
            transaction_id=str(payment.get("id", "")),
            amount=Decimal(str(payment.get("transaction_amount", 0))),
            currency=payment.get("currency_id", "USD"),
            status=status_mapping.get(mp_status, PaymentStatus.PENDING),
            metadata=payment.get("metadata", {}),
            raw_data=payload,
            timestamp=datetime.utcnow(),
        )
    
    def refund_payment(self, transaction_id: str, amount: Optional[Decimal] = None) -> PaymentResponse:
        """Procesa un reembolso en MercadoPago"""
        if not self._sdk:
            return self._mp_not_configured_by_id(transaction_id)
        
        try:
            refund_data = {}
            if amount:
                refund_data["amount"] = float(amount)
            
            refund_response = self._sdk.refund().create(transaction_id, refund_data)
            refund = refund_response.get("response", {})
            
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_REFUNDED,
                provider=self.provider_name,
                reference_id="",
                transaction_id=transaction_id,
                amount=Decimal(str(refund.get("amount", 0))),
                currency="USD",
                status=PaymentStatus.REFUNDED,
                metadata={},
                raw_response=refund,
            )
            
        except Exception as e:
            logger.error(f"[MercadoPagoAdapter] Error en reembolso: {e}")
            return PaymentResponse(
                event=PaymentEvent.PAYMENT_FAILED,
                provider=self.provider_name,
                reference_id="",
                transaction_id=transaction_id,
                amount=Decimal("0"),
                currency="USD",
                status=PaymentStatus.FAILED,
                metadata={},
                error_message=str(e),
            )
    
    def _mp_not_configured(self, request: PaymentRequest) -> PaymentResponse:
        return PaymentResponse(
            event=PaymentEvent.PAYMENT_FAILED,
            provider=self.provider_name,
            reference_id=request.reference_id,
            transaction_id="",
            amount=request.amount,
            currency=request.currency,
            status=PaymentStatus.FAILED,
            metadata={},
            error_message="MercadoPago no configurado",
        )
    
    def _mp_not_configured_by_id(self, transaction_id: str) -> PaymentResponse:
        return PaymentResponse(
            event=PaymentEvent.PAYMENT_FAILED,
            provider=self.provider_name,
            reference_id="",
            transaction_id=transaction_id,
            amount=Decimal("0"),
            currency="USD",
            status=PaymentStatus.FAILED,
            metadata={},
            error_message="MercadoPago no configurado",
        )


# ============================================================================
# PAYMENT SERVICE - Servicio Principal
# ============================================================================

class PaymentService:
    """
    Servicio principal de pagos.
    Actúa como fachada para los diferentes adapters de pasarelas.
    
    Uso:
        service = PaymentService()
        
        # Crear pago con el adapter por defecto (mock en desarrollo)
        response = service.create_payment(request)
        
        # Crear pago con adapter específico
        response = service.create_payment(request, provider="stripe")
    """
    
    _adapters: Dict[str, PaymentProvider] = {}
    _default_provider: str = "mock"
    
    def __init__(self):
        # Registrar adapters disponibles
        self._adapters = {
            "mock": MockPaymentAdapter(),
            "stripe": StripePaymentAdapter(),
            "mercadopago": MercadoPagoPaymentAdapter(),
        }
        
        # Determinar provider por defecto según environment
        from django.conf import settings
        if getattr(settings, 'DEBUG', True):
            self._default_provider = "mock"
        elif getattr(settings, 'STRIPE_SECRET_KEY', ''):
            self._default_provider = "stripe"
    
    def get_adapter(self, provider: str = None) -> PaymentProvider:
        """Obtiene el adapter para un provider específico"""
        provider = provider or self._default_provider
        adapter = self._adapters.get(provider)
        
        if not adapter:
            raise ValueError(f"Provider '{provider}' no soportado")
        
        return adapter
    
    def register_adapter(self, name: str, adapter: PaymentProvider):
        """Registra un adapter personalizado"""
        self._adapters[name] = adapter
    
    def create_payment(self, request: PaymentRequest, provider: str = None) -> PaymentResponse:
        """Crea un pago usando el adapter especificado"""
        adapter = self.get_adapter(provider)
        return adapter.create_payment(request)
    
    def confirm_payment(self, transaction_id: str, provider: str = None) -> PaymentResponse:
        """Confirma un pago"""
        adapter = self.get_adapter(provider)
        return adapter.confirm_payment(transaction_id)
    
    def handle_webhook(self, provider: str, payload: Dict[str, Any], signature: str) -> WebhookPayload:
        """Procesa un webhook de cualquier pasarela"""
        adapter = self.get_adapter(provider)
        return adapter.handle_webhook(payload, signature)
    
    def refund_payment(self, transaction_id: str, provider: str = None, amount: Optional[Decimal] = None) -> PaymentResponse:
        """Procesa un reembolso"""
        adapter = self.get_adapter(provider)
        return adapter.refund_payment(transaction_id, amount)


# Instancia singleton del servicio
payment_service = PaymentService()
