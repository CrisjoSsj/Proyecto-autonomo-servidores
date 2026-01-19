"""
Serializers para Partners B2B
==============================
Pilar 2: Webhooks e Interoperabilidad B2B

Serializers para:
- Registro de partners
- Suscripciones a eventos
- Historial de entregas de webhooks
"""
from rest_framework import serializers
from ..models import Partner, WebhookSubscription, WebhookDelivery, WebhookEventLog


class PartnerRegistrationSerializer(serializers.Serializer):
    """
    Serializer para el registro de nuevos partners.
    
    POST /partners/register
    {
        "name": "Grupo B - Restaurante",
        "code": "grupo_b_restaurante",
        "webhook_url": "https://grupo-b.com/webhooks/findyourwork",
        "events": ["booking.confirmed", "payment.success"],
        "contact_email": "admin@grupo-b.com",
        "description": "Sistema de reservas de mesas"
    }
    """
    name = serializers.CharField(max_length=100, help_text="Nombre del partner")
    code = serializers.SlugField(
        max_length=50, 
        help_text="Código único identificador (solo letras, números, guiones)"
    )
    webhook_url = serializers.URLField(help_text="URL donde se enviarán los webhooks")
    events = serializers.ListField(
        child=serializers.ChoiceField(choices=[e[0] for e in WebhookSubscription.EVENTOS_DISPONIBLES]),
        help_text="Lista de eventos a los que suscribirse"
    )
    contact_email = serializers.EmailField(required=False, help_text="Email de contacto")
    description = serializers.CharField(required=False, max_length=500, help_text="Descripción del partner")
    
    def validate_code(self, value):
        """Verifica que el código no exista"""
        if Partner.objects.filter(code=value).exists():
            raise serializers.ValidationError("Ya existe un partner con este código")
        return value.lower()
    
    def validate_events(self, value):
        """Verifica que se proporcione al menos un evento"""
        if not value:
            raise serializers.ValidationError("Debe suscribirse a al menos un evento")
        return value
    
    def create(self, validated_data):
        """Crea el partner y sus suscripciones"""
        events = validated_data.pop('events')
        
        # Crear partner (el secret se genera automáticamente)
        partner = Partner.objects.create(**validated_data)
        
        # Crear suscripciones
        for event_type in events:
            WebhookSubscription.objects.create(
                partner=partner,
                event_type=event_type,
                is_active=True
            )
        
        return partner


class PartnerResponseSerializer(serializers.ModelSerializer):
    """
    Serializer para respuestas de partner.
    Incluye el secret solo en la creación.
    """
    events = serializers.SerializerMethodField()
    
    class Meta:
        model = Partner
        fields = [
            'id', 'name', 'code', 'description',
            'webhook_url', 'webhook_secret', 'api_key',
            'status', 'contact_email', 'events',
            'created_at', 'last_webhook_at'
        ]
        read_only_fields = ['id', 'webhook_secret', 'api_key', 'created_at', 'last_webhook_at']
    
    def get_events(self, obj):
        """Retorna la lista de eventos suscritos"""
        return list(obj.subscriptions.filter(is_active=True).values_list('event_type', flat=True))


class PartnerListSerializer(serializers.ModelSerializer):
    """Serializer para listar partners (sin secrets)"""
    subscription_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Partner
        fields = [
            'id', 'name', 'code', 'status',
            'webhook_url', 'contact_email',
            'subscription_count', 'last_webhook_at'
        ]
    
    def get_subscription_count(self, obj):
        return obj.subscriptions.filter(is_active=True).count()


class WebhookSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para suscripciones a eventos"""
    partner_code = serializers.CharField(source='partner.code', read_only=True)
    
    class Meta:
        model = WebhookSubscription
        fields = ['id', 'partner_code', 'event_type', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class AddSubscriptionSerializer(serializers.Serializer):
    """Serializer para agregar nuevas suscripciones"""
    events = serializers.ListField(
        child=serializers.ChoiceField(choices=[e[0] for e in WebhookSubscription.EVENTOS_DISPONIBLES]),
        help_text="Lista de eventos a agregar"
    )


class WebhookDeliverySerializer(serializers.ModelSerializer):
    """Serializer para historial de entregas"""
    partner_code = serializers.CharField(source='partner.code', read_only=True)
    
    class Meta:
        model = WebhookDelivery
        fields = [
            'id', 'partner_code', 'event_type', 'status',
            'attempts', 'response_code', 'error_message',
            'created_at', 'delivered_at', 'next_retry_at'
        ]


class WebhookEventLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de eventos"""
    partner_code = serializers.CharField(source='partner.code', read_only=True, allow_null=True)
    
    class Meta:
        model = WebhookEventLog
        fields = [
            'id', 'partner_code', 'direction', 'event_type',
            'signature_valid', 'processed', 'processing_result',
            'created_at', 'processed_at'
        ]


class IncomingWebhookSerializer(serializers.Serializer):
    """
    Serializer para webhooks entrantes de partners.
    Valida el formato estándar de eventos.
    """
    event = serializers.CharField(max_length=50, help_text="Tipo de evento")
    timestamp = serializers.DateTimeField(required=False, help_text="Timestamp del evento")
    source = serializers.CharField(max_length=50, required=False, help_text="Sistema origen")
    data = serializers.DictField(help_text="Datos del evento")
    metadata = serializers.DictField(required=False, default=dict)
    
    def validate_event(self, value):
        """Valida que el evento sea reconocido"""
        # Eventos permitidos de partners externos
        allowed_events = [
            'order.created',
            'order.updated',
            'order.cancelled',
            'tour.purchased',
            'service.activated',
            'service.deactivated',
            'table.reserved',
            'queue.updated',
        ]
        
        if value not in allowed_events:
            # Permitir pero loguear eventos desconocidos
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Evento no reconocido recibido: {value}")
        
        return value


class PaymentWebhookNormalizedSerializer(serializers.Serializer):
    """
    Serializer para webhooks de pago normalizados.
    Formato estándar para comunicación B2B.
    
    {
        "event": "payment.success",
        "provider": "stripe | mock | mercadopago",
        "referenceId": "string",
        "amount": number,
        "currency": "USD",
        "metadata": {}
    }
    """
    event = serializers.ChoiceField(choices=[
        'payment.pending',
        'payment.success',
        'payment.failed',
        'payment.refunded',
        'payment.cancelled',
    ])
    provider = serializers.ChoiceField(choices=['mock', 'stripe', 'mercadopago', 'payu', 'manual'])
    referenceId = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3, default='USD')
    metadata = serializers.DictField(required=False, default=dict)
