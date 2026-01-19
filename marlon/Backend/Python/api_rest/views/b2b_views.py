"""
B2B Webhook Views - Endpoints para Interoperabilidad B2B
==========================================================
Pilar 2: Webhooks e Interoperabilidad B2B

Este módulo implementa:
1. POST /partners/register - Registro de nuevos partners
2. GET /partners/ - Listar partners registrados
3. POST /partners/{code}/subscriptions - Agregar suscripciones
4. POST /webhooks/b2b/receive - Recibir webhooks de partners
5. GET /webhooks/b2b/deliveries - Historial de entregas
"""
import json
import logging
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from ..models import (
    Partner, 
    WebhookSubscription, 
    WebhookDelivery, 
    WebhookEventLog,
    Reserva,
    Servicio,
)
from ..serializers.partner import (
    PartnerRegistrationSerializer,
    PartnerResponseSerializer,
    PartnerListSerializer,
    WebhookSubscriptionSerializer,
    AddSubscriptionSerializer,
    WebhookDeliverySerializer,
    WebhookEventLogSerializer,
    IncomingWebhookSerializer,
)
from ..services.webhooks import webhook_dispatcher

logger = logging.getLogger(__name__)


# ============================================================================
# REGISTRO DE PARTNERS
# ============================================================================

class PartnerRegisterView(APIView):
    """
    POST /partners/register
    
    Registra un nuevo partner B2B y genera credenciales.
    
    Request:
    {
        "name": "Grupo B - Restaurante",
        "code": "grupo_b_restaurante",
        "webhook_url": "https://grupo-b.com/webhooks/findyourwork",
        "events": ["booking.confirmed", "payment.success"],
        "contact_email": "admin@grupo-b.com"
    }
    
    Response:
    {
        "status": "success",
        "message": "Partner registrado exitosamente",
        "partner": {
            "id": 1,
            "name": "Grupo B - Restaurante",
            "code": "grupo_b_restaurante",
            "webhook_url": "...",
            "webhook_secret": "abc123...",  // Guardar esto!
            "api_key": "xyz789...",         // Guardar esto!
            "events": ["booking.confirmed", "payment.success"]
        },
        "instructions": {
            "signature_header": "X-Signature",
            "timestamp_header": "X-Timestamp",
            "signature_algorithm": "HMAC-SHA256"
        }
    }
    """
    permission_classes = [AllowAny]  # En producción usar IsAdminUser
    
    def post(self, request):
        serializer = PartnerRegistrationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        partner = serializer.save()
        
        logger.info(f"✅ Nuevo partner registrado: {partner.code}")
        
        return Response({
            'status': 'success',
            'message': 'Partner registrado exitosamente',
            'partner': PartnerResponseSerializer(partner).data,
            'instructions': {
                'signature_header': 'X-Signature',
                'timestamp_header': 'X-Timestamp',
                'signature_algorithm': 'HMAC-SHA256',
                'signature_format': 'sha256=<hex_signature>',
                'note': 'Guarda el webhook_secret y api_key de forma segura. No se mostrarán de nuevo.'
            }
        }, status=status.HTTP_201_CREATED)


class PartnerListView(APIView):
    """
    GET /partners/
    
    Lista todos los partners registrados.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        partners = Partner.objects.all().order_by('-created_at')
        serializer = PartnerListSerializer(partners, many=True)
        
        return Response({
            'count': partners.count(),
            'partners': serializer.data
        })


class PartnerDetailView(APIView):
    """
    GET /partners/{code}/
    PUT /partners/{code}/
    DELETE /partners/{code}/
    
    Detalle, actualización y eliminación de partner.
    """
    permission_classes = [IsAdminUser]
    
    def get_partner(self, code):
        try:
            return Partner.objects.get(code=code)
        except Partner.DoesNotExist:
            return None
    
    def get(self, request, code):
        partner = self.get_partner(code)
        if not partner:
            return Response({
                'error': 'Partner no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(PartnerResponseSerializer(partner).data)
    
    def put(self, request, code):
        partner = self.get_partner(code)
        if not partner:
            return Response({
                'error': 'Partner no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Actualizar campos permitidos
        allowed_fields = ['name', 'webhook_url', 'status', 'contact_email', 'description']
        for field in allowed_fields:
            if field in request.data:
                setattr(partner, field, request.data[field])
        
        partner.save()
        
        return Response({
            'status': 'success',
            'partner': PartnerResponseSerializer(partner).data
        })
    
    def delete(self, request, code):
        partner = self.get_partner(code)
        if not partner:
            return Response({
                'error': 'Partner no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        partner.delete()
        logger.info(f"🗑️ Partner eliminado: {code}")
        
        return Response({
            'status': 'success',
            'message': f'Partner {code} eliminado'
        })


class PartnerSubscriptionsView(APIView):
    """
    GET /partners/{code}/subscriptions
    POST /partners/{code}/subscriptions
    
    Gestión de suscripciones de un partner.
    """
    permission_classes = [IsAdminUser]
    
    def get_partner(self, code):
        try:
            return Partner.objects.get(code=code)
        except Partner.DoesNotExist:
            return None
    
    def get(self, request, code):
        partner = self.get_partner(code)
        if not partner:
            return Response({
                'error': 'Partner no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        subscriptions = partner.subscriptions.all()
        serializer = WebhookSubscriptionSerializer(subscriptions, many=True)
        
        return Response({
            'partner': code,
            'subscriptions': serializer.data,
            'available_events': [e[0] for e in WebhookSubscription.EVENTOS_DISPONIBLES]
        })
    
    def post(self, request, code):
        partner = self.get_partner(code)
        if not partner:
            return Response({
                'error': 'Partner no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AddSubscriptionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        added = []
        for event_type in serializer.validated_data['events']:
            sub, created = WebhookSubscription.objects.get_or_create(
                partner=partner,
                event_type=event_type,
                defaults={'is_active': True}
            )
            if created:
                added.append(event_type)
            elif not sub.is_active:
                sub.is_active = True
                sub.save()
                added.append(event_type)
        
        return Response({
            'status': 'success',
            'added_events': added,
            'message': f'{len(added)} suscripciones agregadas'
        })


# ============================================================================
# RECEPCIÓN DE WEBHOOKS DE PARTNERS
# ============================================================================

class B2BWebhookReceiveView(APIView):
    """
    POST /webhooks/b2b/receive
    
    Endpoint para recibir webhooks de partners externos.
    
    Headers requeridos:
    - X-Signature: sha256=<firma_hmac>
    - X-Timestamp: <timestamp_iso>
    - X-Partner-Code: <codigo_partner>
    
    Body:
    {
        "event": "order.created",
        "timestamp": "2026-01-16T10:00:00Z",
        "source": "grupo_b_restaurante",
        "data": { ... }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Obtener headers de seguridad
        signature = request.headers.get('X-Signature', '')
        timestamp = request.headers.get('X-Timestamp', '')
        partner_code = request.headers.get('X-Partner-Code', '')
        
        # También aceptar partner code del body
        if not partner_code:
            partner_code = request.data.get('source', '')
        
        if not partner_code:
            return Response({
                'error': 'X-Partner-Code header o campo "source" requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el partner existe
        try:
            partner = Partner.objects.get(code=partner_code, status='active')
        except Partner.DoesNotExist:
            logger.warning(f"⚠️ Webhook de partner desconocido: {partner_code}")
            return Response({
                'error': 'Partner no reconocido o inactivo'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verificar firma HMAC
        signature_valid = True
        if signature:
            raw_body = request.body
            signature_valid = webhook_dispatcher.verify_incoming_signature(
                raw_body, signature, partner_code
            )
            
            if not signature_valid:
                logger.warning(f"⚠️ Firma inválida de partner: {partner_code}")
                
                # Registrar intento con firma inválida
                webhook_dispatcher.log_incoming_event(
                    partner_code=partner_code,
                    event_type=request.data.get('event', 'unknown'),
                    payload=request.data,
                    headers=dict(request.headers),
                    signature_valid=False
                )
                
                return Response({
                    'error': 'Firma inválida'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Validar payload
        serializer = IncomingWebhookSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Payload inválido',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        event_type = serializer.validated_data['event']
        event_data = serializer.validated_data['data']
        
        # Registrar evento entrante
        webhook_dispatcher.log_incoming_event(
            partner_code=partner_code,
            event_type=event_type,
            payload=request.data,
            headers={
                'X-Signature': signature,
                'X-Timestamp': timestamp,
                'X-Partner-Code': partner_code,
            },
            signature_valid=signature_valid
        )
        
        logger.info(f"📥 Webhook recibido de {partner_code}: {event_type}")
        
        # Procesar el evento según su tipo
        result = self._process_event(event_type, event_data, partner)
        
        return Response({
            'status': 'received',
            'event': event_type,
            'processed': result.get('processed', False),
            'message': result.get('message', 'Evento recibido'),
        })
    
    def _process_event(self, event_type: str, data: dict, partner) -> dict:
        """
        Procesa el evento recibido y actualiza el estado interno.
        
        Eventos del Grupo B (restaurante) que podemos recibir:
        - order.created: Se creó una orden/pedido
        - tour.purchased: Se compró un tour/servicio
        - service.activated: Se activó un servicio
        - table.reserved: Se reservó una mesa
        - queue.updated: Actualización de cola virtual
        """
        try:
            if event_type == 'order.created':
                return self._handle_order_created(data, partner)
            
            elif event_type == 'tour.purchased':
                return self._handle_tour_purchased(data, partner)
            
            elif event_type == 'service.activated':
                return self._handle_service_activated(data, partner)
            
            elif event_type == 'table.reserved':
                return self._handle_table_reserved(data, partner)
            
            elif event_type == 'queue.updated':
                return self._handle_queue_updated(data, partner)
            
            else:
                logger.info(f"📋 Evento no manejado específicamente: {event_type}")
                return {
                    'processed': True,
                    'message': f'Evento {event_type} registrado'
                }
                
        except Exception as e:
            logger.error(f"❌ Error procesando evento {event_type}: {e}")
            return {
                'processed': False,
                'message': str(e)
            }
    
    def _handle_order_created(self, data: dict, partner) -> dict:
        """
        Maneja el evento order.created del partner.
        Podría crear una reserva vinculada o actualizar estado.
        """
        order_id = data.get('order_id')
        customer_email = data.get('customer_email')
        
        logger.info(f"📦 Orden creada en partner {partner.code}: {order_id}")
        
        # Aquí podrías:
        # 1. Crear una reserva vinculada
        # 2. Notificar al cliente
        # 3. Sincronizar inventario
        
        return {
            'processed': True,
            'message': f'Orden {order_id} registrada'
        }
    
    def _handle_tour_purchased(self, data: dict, partner) -> dict:
        """Maneja la compra de un tour desde el partner"""
        tour_id = data.get('tour_id')
        cliente_id = data.get('cliente_id')
        
        logger.info(f"🎫 Tour comprado: {tour_id} por cliente {cliente_id}")
        
        return {
            'processed': True,
            'message': f'Compra de tour {tour_id} registrada'
        }
    
    def _handle_service_activated(self, data: dict, partner) -> dict:
        """Maneja la activación de un servicio desde el partner"""
        service_id = data.get('service_id')
        
        logger.info(f"✅ Servicio activado desde partner: {service_id}")
        
        return {
            'processed': True,
            'message': f'Activación de servicio {service_id} registrada'
        }
    
    def _handle_table_reserved(self, data: dict, partner) -> dict:
        """Maneja la reserva de mesa del partner (Grupo B)"""
        table_id = data.get('table_id')
        reservation_time = data.get('reservation_time')
        
        logger.info(f"🍽️ Mesa reservada: {table_id} para {reservation_time}")
        
        return {
            'processed': True,
            'message': f'Reserva de mesa {table_id} sincronizada'
        }
    
    def _handle_queue_updated(self, data: dict, partner) -> dict:
        """Maneja actualización de cola virtual del partner"""
        queue_position = data.get('position')
        estimated_wait = data.get('estimated_wait_minutes')
        
        logger.info(f"🔄 Cola actualizada: posición {queue_position}, espera {estimated_wait}min")
        
        return {
            'processed': True,
            'message': 'Estado de cola actualizado'
        }


# ============================================================================
# HISTORIAL Y LOGS
# ============================================================================

class WebhookDeliveriesView(APIView):
    """
    GET /webhooks/b2b/deliveries
    
    Lista el historial de entregas de webhooks.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        partner_code = request.query_params.get('partner')
        status_filter = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 50))
        
        deliveries = WebhookDelivery.objects.all()
        
        if partner_code:
            deliveries = deliveries.filter(partner__code=partner_code)
        
        if status_filter:
            deliveries = deliveries.filter(status=status_filter)
        
        deliveries = deliveries.order_by('-created_at')[:limit]
        serializer = WebhookDeliverySerializer(deliveries, many=True)
        
        return Response({
            'count': len(serializer.data),
            'deliveries': serializer.data
        })


class WebhookEventLogsView(APIView):
    """
    GET /webhooks/b2b/logs
    
    Lista logs de eventos webhook (entrantes y salientes).
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        direction = request.query_params.get('direction')  # incoming/outgoing
        partner_code = request.query_params.get('partner')
        limit = int(request.query_params.get('limit', 100))
        
        logs = WebhookEventLog.objects.all()
        
        if direction:
            logs = logs.filter(direction=direction)
        
        if partner_code:
            logs = logs.filter(partner__code=partner_code)
        
        logs = logs.order_by('-created_at')[:limit]
        serializer = WebhookEventLogSerializer(logs, many=True)
        
        return Response({
            'count': len(serializer.data),
            'logs': serializer.data
        })


class RetryFailedDeliveriesView(APIView):
    """
    POST /webhooks/b2b/retry
    
    Reintenta las entregas fallidas.
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        count = webhook_dispatcher.retry_failed_deliveries()
        
        return Response({
            'status': 'success',
            'retried_count': count,
            'message': f'{count} entregas reintentadas'
        })


# ============================================================================
# EVENTOS DISPONIBLES
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def available_events(request):
    """
    GET /partners/events
    
    Lista los eventos disponibles para suscripción.
    """
    events = WebhookSubscription.EVENTOS_DISPONIBLES
    
    return Response({
        'events': [
            {
                'code': code,
                'description': description,
                'direction': 'outgoing' if 'order' not in code and 'tour' not in code else 'incoming'
            }
            for code, description in events
        ],
        'outgoing_events': [
            'booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.completed',
            'payment.success', 'payment.failed', 'payment.refunded',
            'service.created', 'service.updated', 'service.activated', 'service.deactivated'
        ],
        'incoming_events': [
            'order.created', 'tour.purchased', 'table.reserved', 'queue.updated'
        ]
    })
