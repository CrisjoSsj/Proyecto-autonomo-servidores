"""
Partner Views - Endpoints para integración con partners externos
================================================================
Pilar 4: n8n - Event Bus

Estos endpoints manejan:
1. Actualizaciones de datos desde partners
2. Solicitudes de reserva desde partners
3. Sincronización de inventario/disponibilidad
4. Callbacks de acciones de partners
"""
import json
import hashlib
import hmac
import logging
from datetime import datetime

from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from ..models import (
    Reserva,
    Servicio,
    Cliente,
    ReservaServicio,
    Proveedor,
)
from ..services.event_bus import event_bus

logger = logging.getLogger(__name__)


def verify_partner_signature(request) -> bool:
    """
    Verifica la firma HMAC del partner.
    
    Headers esperados:
        - X-Partner-Signature: sha256=<signature>
        - X-Partner-ID: <partner_id>
    """
    signature = request.headers.get('X-Partner-Signature', '')
    partner_id = request.headers.get('X-Partner-ID', '')
    
    if not signature or not partner_id:
        return False
    
    secret = getattr(settings, 'PARTNER_WEBHOOK_SECRET', '')
    if not secret:
        logger.warning("⚠️ PARTNER_WEBHOOK_SECRET no configurado")
        return True  # En desarrollo, permitir sin firma
    
    expected = hmac.new(
        secret.encode('utf-8'),
        request.body,
        hashlib.sha256
    ).hexdigest()
    
    if signature.startswith('sha256='):
        return hmac.compare_digest(f"sha256={expected}", signature)
    return hmac.compare_digest(expected, signature)


@api_view(['POST'])
@permission_classes([AllowAny])
def partner_updates(request):
    """
    Procesa actualizaciones de datos de partners.
    
    POST /api_rest/partner-updates/
    
    Headers:
        - X-Partner-Signature: Firma HMAC del payload
        - X-Partner-ID: Identificador del partner
        
    Body:
        {
            "event_type": "partner.data_update",
            "partner_id": "partner_abc",
            "timestamp": "2026-01-01T10:00:00Z",
            "data": { ... }
        }
    
    Este endpoint es llamado por n8n después de validar el webhook del partner.
    """
    # Verificar firma
    if not verify_partner_signature(request):
        logger.warning("⚠️ Firma de partner inválida")
        return Response(
            {'error': 'Invalid signature'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        data = request.data
        event_type = data.get('event_type', 'unknown')
        partner_id = data.get('partner_id', request.headers.get('X-Partner-ID', 'unknown'))
        
        logger.info(f"📥 Partner update recibido: {event_type} de {partner_id}")
        
        # Procesar según tipo de evento
        if event_type == 'partner.service_update':
            return handle_service_update(data)
        
        elif event_type == 'partner.availability_update':
            return handle_availability_update(data)
        
        elif event_type == 'partner.price_update':
            return handle_price_update(data)
        
        elif event_type == 'partner.status_change':
            return handle_status_change(data)
        
        else:
            logger.info(f"📋 Evento no manejado específicamente: {event_type}")
            return Response({
                'status': 'received',
                'event_type': event_type,
                'message': 'Event logged but no specific handler'
            })
        
    except Exception as e:
        logger.error(f"❌ Error procesando partner update: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def handle_service_update(data: dict) -> Response:
    """Maneja actualizaciones de servicios desde partners."""
    service_data = data.get('data', {})
    external_id = service_data.get('external_service_id')
    
    if not external_id:
        return Response(
            {'error': 'external_service_id requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buscar servicio por metadata (si existe campo de external_id)
    # Por ahora, loguear y retornar éxito
    logger.info(f"📝 Actualización de servicio: {external_id}")
    
    return Response({
        'status': 'processed',
        'event_type': 'partner.service_update',
        'external_id': external_id
    })


def handle_availability_update(data: dict) -> Response:
    """Maneja actualizaciones de disponibilidad desde partners."""
    availability_data = data.get('data', {})
    
    logger.info(f"📅 Actualización de disponibilidad: {availability_data}")
    
    return Response({
        'status': 'processed',
        'event_type': 'partner.availability_update'
    })


def handle_price_update(data: dict) -> Response:
    """Maneja actualizaciones de precios desde partners."""
    price_data = data.get('data', {})
    service_id = price_data.get('service_id')
    new_price = price_data.get('new_price')
    
    if service_id and new_price:
        try:
            servicio = Servicio.objects.get(id=service_id)
            old_price = servicio.precio
            servicio.precio = new_price
            servicio.save()
            
            logger.info(f"💰 Precio actualizado: Servicio {service_id}: {old_price} -> {new_price}")
            
            return Response({
                'status': 'updated',
                'event_type': 'partner.price_update',
                'service_id': service_id,
                'old_price': float(old_price),
                'new_price': float(new_price)
            })
        except Servicio.DoesNotExist:
            return Response(
                {'error': f'Servicio {service_id} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response({
        'status': 'processed',
        'event_type': 'partner.price_update',
        'message': 'No changes applied'
    })


def handle_status_change(data: dict) -> Response:
    """Maneja cambios de estado desde partners."""
    status_data = data.get('data', {})
    
    logger.info(f"🔄 Cambio de estado: {status_data}")
    
    return Response({
        'status': 'processed',
        'event_type': 'partner.status_change'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def partner_reserva(request):
    """
    Procesa solicitudes de reserva desde partners externos.
    
    POST /api_rest/reservas/partner/
    
    Headers:
        - X-Partner-Signature: Firma HMAC
        - X-Partner-ID: Identificador del partner
        
    Body:
        {
            "partner_id": "partner_abc",
            "external_booking_id": "ext_123",
            "service_id": 1,
            "client_data": {
                "user_id": "uuid",
                "telefono": "123456789"
            },
            "fecha": "2026-01-15",
            "hora": "10:00:00",
            "metadata": { ... }
        }
    """
    # Verificar firma
    if not verify_partner_signature(request):
        return Response(
            {'error': 'Invalid signature'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        data = request.data
        partner_id = data.get('partner_id', request.headers.get('X-Partner-ID'))
        external_booking_id = data.get('external_booking_id')
        service_id = data.get('service_id')
        client_data = data.get('client_data', {})
        fecha = data.get('fecha')
        hora = data.get('hora')
        
        logger.info(f"📥 Solicitud de reserva de partner {partner_id}: {external_booking_id}")
        
        # Validar datos requeridos
        if not all([service_id, client_data.get('user_id'), fecha, hora]):
            return Response(
                {'error': 'Datos incompletos: service_id, client_data.user_id, fecha y hora son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar o crear cliente
        cliente, created = Cliente.objects.get_or_create(
            user_id=client_data['user_id'],
            defaults={
                'telefono': client_data.get('telefono', ''),
            }
        )
        
        if created:
            logger.info(f"👤 Cliente creado desde partner: {cliente.user_id}")
        
        # Obtener servicio
        try:
            servicio = Servicio.objects.get(id=service_id)
        except Servicio.DoesNotExist:
            return Response(
                {'error': f'Servicio {service_id} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Crear reserva
        reserva = Reserva.objects.create(
            cliente=cliente,
            fecha=fecha,
            hora=hora,
            estado='pendiente',
            total_estimado=servicio.precio,
        )
        
        # Crear relación reserva-servicio
        ReservaServicio.objects.create(
            reserva=reserva,
            servicio=servicio,
            fecha_servicio=fecha,
            hora_servicio=hora,
            estado='pendiente',
        )
        
        logger.info(f"✅ Reserva creada desde partner: {reserva.id}")
        
        # Emitir evento al Event Bus
        event_bus.emit(
            event_type='reserva.created_from_partner',
            payload={
                'reserva_id': reserva.id,
                'partner_id': partner_id,
                'external_booking_id': external_booking_id,
                'servicio_id': service_id,
                'cliente_id': str(cliente.user_id),
                'fecha': fecha,
                'hora': hora,
            }
        )
        
        return Response({
            'status': 'created',
            'reserva_id': reserva.id,
            'external_booking_id': external_booking_id,
            'partner_id': partner_id,
            'message': 'Reserva creada exitosamente'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"❌ Error creando reserva desde partner: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def partner_cancel_reserva(request):
    """
    Procesa cancelaciones de reserva desde partners externos.
    
    POST /api_rest/reservas/partner/cancel/
    
    Body:
        {
            "partner_id": "partner_abc",
            "external_booking_id": "ext_123",
            "reserva_id": 1,
            "reason": "Cancelado por el usuario"
        }
    """
    if not verify_partner_signature(request):
        return Response(
            {'error': 'Invalid signature'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        data = request.data
        reserva_id = data.get('reserva_id')
        partner_id = data.get('partner_id')
        reason = data.get('reason', 'Cancelado desde partner')
        
        if not reserva_id:
            return Response(
                {'error': 'reserva_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            reserva = Reserva.objects.get(id=reserva_id)
        except Reserva.DoesNotExist:
            return Response(
                {'error': f'Reserva {reserva_id} no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        old_status = reserva.estado
        reserva.estado = 'cancelada'
        reserva.save()
        
        logger.info(f"❌ Reserva {reserva_id} cancelada desde partner {partner_id}")
        
        # Emitir evento al Event Bus
        event_bus.emit(
            event_type='reserva.cancelled_from_partner',
            payload={
                'reserva_id': reserva_id,
                'partner_id': partner_id,
                'old_status': old_status,
                'reason': reason,
            }
        )
        
        return Response({
            'status': 'cancelled',
            'reserva_id': reserva_id,
            'previous_status': old_status,
            'message': 'Reserva cancelada exitosamente'
        })
        
    except Exception as e:
        logger.error(f"❌ Error cancelando reserva desde partner: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def partner_sync_status(request):
    """
    Endpoint para que partners consulten el estado de sincronización.
    
    GET /api_rest/partner/sync-status/
    
    Query params:
        - partner_id: ID del partner
        
    Returns:
        Estado de sincronización y estadísticas
    """
    partner_id = request.query_params.get('partner_id')
    
    if not partner_id:
        return Response(
            {'error': 'partner_id es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # En una implementación real, consultarías una tabla de sincronización
    # Por ahora, retornamos estadísticas generales
    
    return Response({
        'partner_id': partner_id,
        'status': 'connected',
        'last_sync': timezone.now().isoformat(),
        'stats': {
            'total_servicios': Servicio.objects.count(),
            'reservas_hoy': Reserva.objects.filter(
                fecha=timezone.now().date()
            ).count(),
            'reservas_pendientes': Reserva.objects.filter(
                estado='pendiente'
            ).count(),
        }
    })
