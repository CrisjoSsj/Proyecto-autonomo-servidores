"""
Modelo PaymentTransaction - Transacciones de Pago Normalizadas
===============================================================
Pilar 2: Webhooks e Interoperabilidad B2B

Este modelo almacena todas las transacciones de pago en un formato
normalizado, independientemente de la pasarela de origen.

Formato normalizado:
{
    "event": "payment.success",
    "provider": "stripe | mock | mercadopago",
    "referenceId": "string",
    "amount": number,
    "currency": "USD",
    "metadata": {}
}
"""
from django.db import models
from .reserva import Reserva


class PaymentTransaction(models.Model):
    """
    Transacción de pago normalizada.
    Almacena información de pagos de cualquier pasarela en formato común.
    """
    PROVIDERS = [
        ('mock', 'Mock (Testing)'),
        ('stripe', 'Stripe'),
        ('mercadopago', 'MercadoPago'),
        ('payu', 'PayU'),
        ('manual', 'Manual'),
    ]
    
    EVENTOS = [
        ('payment.pending', 'Pago Pendiente'),
        ('payment.success', 'Pago Exitoso'),
        ('payment.failed', 'Pago Fallido'),
        ('payment.refunded', 'Pago Reembolsado'),
        ('payment.cancelled', 'Pago Cancelado'),
    ]
    
    ESTADOS = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
        ('refunded', 'Reembolsado'),
        ('cancelled', 'Cancelado'),
    ]
    
    # Identificación
    reference_id = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name="ID de Referencia",
        help_text="ID único de la transacción en la pasarela"
    )
    provider = models.CharField(
        max_length=20, 
        choices=PROVIDERS, 
        verbose_name="Proveedor de Pago"
    )
    
    # Relación con reserva (opcional, puede ser pago externo)
    reserva = models.ForeignKey(
        Reserva,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_transactions',
        verbose_name="Reserva asociada"
    )
    
    # Datos del pago
    event = models.CharField(
        max_length=30,
        choices=EVENTOS,
        default='payment.pending',
        verbose_name="Evento de pago"
    )
    status = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='pending',
        verbose_name="Estado"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Monto"
    )
    currency = models.CharField(
        max_length=3,
        default='USD',
        verbose_name="Moneda"
    )
    
    # Datos del cliente (normalizados)
    customer_email = models.EmailField(
        blank=True, 
        null=True, 
        verbose_name="Email del cliente"
    )
    customer_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Nombre del cliente"
    )
    
    # Metadata flexible para datos específicos de cada pasarela
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Metadata adicional"
    )
    
    # Datos del webhook original
    raw_webhook_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Datos crudos del webhook"
    )
    webhook_event_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Tipo de evento webhook original"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Fecha de completado"
    )
    
    class Meta:
        verbose_name = "Transacción de Pago"
        verbose_name_plural = "Transacciones de Pago"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reference_id']),
            models.Index(fields=['provider', 'status']),
            models.Index(fields=['reserva', 'status']),
        ]
    
    def __str__(self):
        return f"{self.provider}/{self.reference_id} - {self.status} ({self.amount} {self.currency})"
    
    def to_normalized_format(self) -> dict:
        """
        Retorna la transacción en formato normalizado estándar.
        Este formato es el contrato común para comunicación B2B.
        
        Returns:
            dict: {
                "event": "payment.success",
                "provider": "stripe",
                "referenceId": "pi_xxx",
                "amount": 100.00,
                "currency": "USD",
                "metadata": {...}
            }
        """
        return {
            "event": self.event,
            "provider": self.provider,
            "referenceId": self.reference_id,
            "amount": float(self.amount),
            "currency": self.currency,
            "metadata": {
                **self.metadata,
                "reserva_id": self.reserva_id,
                "customer_email": self.customer_email,
                "customer_name": self.customer_name,
                "status": self.status,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
        }
    
    @classmethod
    def from_stripe_webhook(cls, webhook_data: dict) -> 'PaymentTransaction':
        """
        Crea una transacción desde un webhook de Stripe.
        
        Args:
            webhook_data: Datos del webhook de Stripe
            
        Returns:
            PaymentTransaction normalizada
        """
        payment_intent = webhook_data.get('data', {}).get('object', {})
        event_type = webhook_data.get('type', '')
        
        # Mapear eventos de Stripe a eventos normalizados
        event_mapping = {
            'payment_intent.succeeded': 'payment.success',
            'payment_intent.payment_failed': 'payment.failed',
            'payment_intent.canceled': 'payment.cancelled',
            'charge.refunded': 'payment.refunded',
        }
        
        status_mapping = {
            'succeeded': 'completed',
            'processing': 'processing',
            'requires_payment_method': 'pending',
            'canceled': 'cancelled',
        }
        
        metadata = payment_intent.get('metadata', {})
        
        return cls(
            reference_id=payment_intent.get('id'),
            provider='stripe',
            event=event_mapping.get(event_type, 'payment.pending'),
            status=status_mapping.get(payment_intent.get('status'), 'pending'),
            amount=payment_intent.get('amount', 0) / 100,  # Stripe usa centavos
            currency=payment_intent.get('currency', 'usd').upper(),
            customer_email=payment_intent.get('receipt_email'),
            metadata=metadata,
            raw_webhook_data=webhook_data,
            webhook_event_type=event_type,
        )
    
    @classmethod
    def from_mercadopago_webhook(cls, webhook_data: dict) -> 'PaymentTransaction':
        """
        Crea una transacción desde un webhook de MercadoPago.
        
        Args:
            webhook_data: Datos del webhook de MercadoPago
            
        Returns:
            PaymentTransaction normalizada
        """
        payment = webhook_data.get('data', {})
        action = webhook_data.get('action', '')
        
        event_mapping = {
            'payment.created': 'payment.pending',
            'payment.updated': 'payment.pending',  # Depende del status
        }
        
        status_mapping = {
            'approved': 'completed',
            'pending': 'pending',
            'in_process': 'processing',
            'rejected': 'failed',
            'refunded': 'refunded',
            'cancelled': 'cancelled',
        }
        
        mp_status = payment.get('status', '')
        
        # Determinar evento basado en status
        if mp_status == 'approved':
            event = 'payment.success'
        elif mp_status == 'rejected':
            event = 'payment.failed'
        elif mp_status == 'refunded':
            event = 'payment.refunded'
        else:
            event = 'payment.pending'
        
        return cls(
            reference_id=str(payment.get('id')),
            provider='mercadopago',
            event=event,
            status=status_mapping.get(mp_status, 'pending'),
            amount=payment.get('transaction_amount', 0),
            currency=payment.get('currency_id', 'USD'),
            customer_email=payment.get('payer', {}).get('email'),
            customer_name=f"{payment.get('payer', {}).get('first_name', '')} {payment.get('payer', {}).get('last_name', '')}".strip(),
            metadata=payment.get('metadata', {}),
            raw_webhook_data=webhook_data,
            webhook_event_type=action,
        )
    
    @classmethod
    def from_mock_payment(cls, payment_data: dict) -> 'PaymentTransaction':
        """
        Crea una transacción desde el adaptador Mock.
        
        Args:
            payment_data: Datos del pago simulado
            
        Returns:
            PaymentTransaction normalizada
        """
        return cls(
            reference_id=payment_data.get('reference_id', f"mock_{payment_data.get('id', '')}"),
            provider='mock',
            event=payment_data.get('event', 'payment.success'),
            status=payment_data.get('status', 'completed'),
            amount=payment_data.get('amount', 0),
            currency=payment_data.get('currency', 'USD'),
            customer_email=payment_data.get('customer_email'),
            customer_name=payment_data.get('customer_name'),
            metadata=payment_data.get('metadata', {}),
            raw_webhook_data=payment_data,
            webhook_event_type='mock.payment',
        )
