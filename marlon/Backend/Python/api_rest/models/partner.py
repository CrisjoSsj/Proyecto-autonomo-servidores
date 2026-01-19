"""
Modelos para Partners B2B y Webhooks
=====================================
Pilar 2: Webhooks e Interoperabilidad B2B

Este módulo implementa:
- Partner: Registro de sistemas externos (Grupo B)
- WebhookSubscription: Suscripciones a eventos específicos
- WebhookDelivery: Historial de entregas de webhooks
- WebhookEventLog: Logs de eventos recibidos/enviados
"""
import secrets
import hashlib
import hmac
from django.db import models
from django.utils import timezone


class Partner(models.Model):
    """
    Representa un sistema externo (partner B2B) registrado.
    Cada partner tiene su propio secret para firmar webhooks.
    """
    ESTADOS = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('suspended', 'Suspendido'),
    ]
    
    # Identificación
    name = models.CharField(max_length=100, verbose_name="Nombre del Partner")
    code = models.CharField(max_length=50, unique=True, verbose_name="Código único")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
    
    # Configuración de Webhook
    webhook_url = models.URLField(verbose_name="URL del Webhook")
    webhook_secret = models.CharField(max_length=64, verbose_name="Secret HMAC compartido")
    
    # Estado y contacto
    status = models.CharField(max_length=20, choices=ESTADOS, default='active')
    contact_email = models.EmailField(blank=True, null=True, verbose_name="Email de contacto")
    
    # Metadatos
    api_key = models.CharField(max_length=64, unique=True, verbose_name="API Key del Partner")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_webhook_at = models.DateTimeField(blank=True, null=True, verbose_name="Último webhook enviado")
    
    class Meta:
        verbose_name = "Partner B2B"
        verbose_name_plural = "Partners B2B"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def save(self, *args, **kwargs):
        """Genera secrets automáticos si no existen"""
        if not self.webhook_secret:
            self.webhook_secret = secrets.token_hex(32)
        if not self.api_key:
            self.api_key = secrets.token_hex(32)
        super().save(*args, **kwargs)
    
    def sign_payload(self, payload: str) -> str:
        """
        Firma un payload con HMAC-SHA256 usando el secret del partner.
        
        Args:
            payload: String JSON del payload a firmar
            
        Returns:
            Firma hexadecimal
        """
        return hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def verify_signature(self, payload: str, signature: str) -> bool:
        """
        Verifica la firma HMAC de un payload recibido.
        
        Args:
            payload: String del payload recibido
            signature: Firma recibida en el header
            
        Returns:
            True si la firma es válida
        """
        expected = self.sign_payload(payload)
        # Soportar formato "sha256=xxx" o solo "xxx"
        if signature.startswith('sha256='):
            return hmac.compare_digest(f"sha256={expected}", signature)
        return hmac.compare_digest(expected, signature)


class WebhookSubscription(models.Model):
    """
    Define qué eventos quiere recibir cada partner.
    Un partner puede suscribirse a múltiples tipos de eventos.
    """
    EVENTOS_DISPONIBLES = [
        # Eventos de reservas
        ('booking.created', 'Reserva creada'),
        ('booking.confirmed', 'Reserva confirmada'),
        ('booking.cancelled', 'Reserva cancelada'),
        ('booking.completed', 'Reserva completada'),
        # Eventos de pagos
        ('payment.success', 'Pago exitoso'),
        ('payment.failed', 'Pago fallido'),
        ('payment.refunded', 'Pago reembolsado'),
        # Eventos de servicios
        ('service.created', 'Servicio creado'),
        ('service.updated', 'Servicio actualizado'),
        ('service.activated', 'Servicio activado'),
        ('service.deactivated', 'Servicio desactivado'),
        # Eventos externos (recibidos del partner)
        ('order.created', 'Orden creada (partner)'),
        ('tour.purchased', 'Tour comprado (partner)'),
    ]
    
    partner = models.ForeignKey(
        Partner, 
        on_delete=models.CASCADE, 
        related_name='subscriptions'
    )
    event_type = models.CharField(
        max_length=50, 
        choices=EVENTOS_DISPONIBLES,
        verbose_name="Tipo de evento"
    )
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Suscripción a Webhook"
        verbose_name_plural = "Suscripciones a Webhooks"
        unique_together = ['partner', 'event_type']
        ordering = ['partner', 'event_type']
    
    def __str__(self):
        return f"{self.partner.code} -> {self.event_type}"


class WebhookDelivery(models.Model):
    """
    Registro de cada intento de entrega de webhook.
    Mantiene historial para debugging y reintentos.
    """
    ESTADOS = [
        ('pending', 'Pendiente'),
        ('sent', 'Enviado'),
        ('delivered', 'Entregado'),
        ('failed', 'Fallido'),
        ('retrying', 'Reintentando'),
    ]
    
    partner = models.ForeignKey(
        Partner, 
        on_delete=models.CASCADE, 
        related_name='deliveries'
    )
    event_type = models.CharField(max_length=50, verbose_name="Tipo de evento")
    payload = models.JSONField(verbose_name="Payload enviado")
    
    # Estado de entrega
    status = models.CharField(max_length=20, choices=ESTADOS, default='pending')
    response_code = models.IntegerField(blank=True, null=True, verbose_name="Código HTTP")
    response_body = models.TextField(blank=True, null=True, verbose_name="Respuesta")
    error_message = models.TextField(blank=True, null=True, verbose_name="Mensaje de error")
    
    # Intentos
    attempts = models.IntegerField(default=0, verbose_name="Intentos realizados")
    max_attempts = models.IntegerField(default=3, verbose_name="Máximo de intentos")
    next_retry_at = models.DateTimeField(blank=True, null=True, verbose_name="Próximo reintento")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de entrega")
    
    class Meta:
        verbose_name = "Entrega de Webhook"
        verbose_name_plural = "Entregas de Webhooks"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.partner.code}/{self.event_type} - {self.status}"
    
    def mark_as_delivered(self, response_code: int, response_body: str = None):
        """Marca la entrega como exitosa"""
        self.status = 'delivered'
        self.response_code = response_code
        self.response_body = response_body
        self.delivered_at = timezone.now()
        self.save()
    
    def mark_as_failed(self, error_message: str, response_code: int = None):
        """Marca la entrega como fallida y programa reintento si aplica"""
        self.attempts += 1
        self.error_message = error_message
        self.response_code = response_code
        
        if self.attempts >= self.max_attempts:
            self.status = 'failed'
        else:
            self.status = 'retrying'
            # Reintento exponencial: 1min, 5min, 15min
            delays = [60, 300, 900]
            delay = delays[min(self.attempts - 1, len(delays) - 1)]
            self.next_retry_at = timezone.now() + timezone.timedelta(seconds=delay)
        
        self.save()


class WebhookEventLog(models.Model):
    """
    Log de todos los eventos de webhook (enviados y recibidos).
    Útil para auditoría y debugging.
    """
    DIRECCIONES = [
        ('outgoing', 'Saliente'),  # Enviado a partner
        ('incoming', 'Entrante'),  # Recibido de partner
    ]
    
    partner = models.ForeignKey(
        Partner, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='event_logs'
    )
    direction = models.CharField(max_length=10, choices=DIRECCIONES)
    event_type = models.CharField(max_length=50, verbose_name="Tipo de evento")
    
    # Datos del evento
    payload = models.JSONField(verbose_name="Payload")
    headers = models.JSONField(default=dict, verbose_name="Headers HTTP")
    
    # Verificación
    signature = models.CharField(max_length=128, blank=True, null=True, verbose_name="Firma HMAC")
    signature_valid = models.BooleanField(default=True, verbose_name="Firma válida")
    
    # Resultado
    processed = models.BooleanField(default=False, verbose_name="Procesado")
    processing_result = models.TextField(blank=True, null=True, verbose_name="Resultado")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Log de Evento Webhook"
        verbose_name_plural = "Logs de Eventos Webhook"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', 'created_at']),
            models.Index(fields=['partner', 'direction']),
        ]
    
    def __str__(self):
        direction_icon = "→" if self.direction == 'outgoing' else "←"
        partner_name = self.partner.code if self.partner else "Unknown"
        return f"{direction_icon} {partner_name}: {self.event_type}"
