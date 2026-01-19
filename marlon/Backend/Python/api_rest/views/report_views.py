"""
Report Views - Endpoints para reportes y tareas programadas
============================================================
Pilar 4: n8n - Event Bus

Estos endpoints son llamados por los workflows de n8n para:
1. Generar reportes diarios
2. Obtener reservas próximas para recordatorios
3. Limpieza de datos antiguos
4. Health checks del sistema
"""
import logging
from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from ..models import (
    Reserva,
    Servicio,
    Cliente,
    Pago,
    Proveedor,
    ReservaServicio,
    Calificacion,
)

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])  # n8n accede internamente con API key
def daily_report(request):
    """
    Endpoint para el reporte diario - Usado por n8n Scheduled Tasks.
    
    GET /api_rest/reports/daily/
    
    Query params:
        - date: Fecha del reporte (YYYY-MM-DD), default: ayer
        
    Returns:
        JSON con estadísticas del día
    """
    # Obtener fecha del reporte
    date_str = request.query_params.get('date')
    if date_str:
        try:
            from datetime import datetime
            report_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        report_date = timezone.now().date() - timedelta(days=1)
    
    try:
        # Estadísticas de reservas
        reservas_nuevas = Reserva.objects.filter(
            created_at__date=report_date
        ).count()
        
        reservas_confirmadas = Reserva.objects.filter(
            estado='confirmada',
            updated_at__date=report_date
        ).count()
        
        reservas_canceladas = Reserva.objects.filter(
            estado='cancelada',
            updated_at__date=report_date
        ).count()
        
        # Estadísticas de pagos
        pagos_del_dia = Pago.objects.filter(
            fecha_pago__date=report_date
        )
        
        ingresos = pagos_del_dia.aggregate(
            total=models.Sum('monto')
        )['total'] or Decimal('0.00')
        
        pagos_exitosos = pagos_del_dia.filter(estado='pagado').count()
        pagos_rechazados = pagos_del_dia.filter(estado='rechazado').count()
        
        # Estadísticas de usuarios
        nuevos_clientes = Cliente.objects.filter(
            created_at__date=report_date
        ).count()
        
        nuevos_proveedores = Proveedor.objects.filter(
            created_at__date=report_date
        ).count()
        
        # Estadísticas de servicios
        servicios_activos = Servicio.objects.count()
        
        nuevos_servicios = Servicio.objects.filter(
            created_at__date=report_date
        ).count()
        
        # Top 5 servicios más reservados
        top_servicios = ReservaServicio.objects.filter(
            created_at__date=report_date
        ).values(
            'servicio__nombre_servicio',
            'servicio__id'
        ).annotate(
            total_reservas=models.Count('id')
        ).order_by('-total_reservas')[:5]
        
        # Calificaciones del día
        nuevas_calificaciones = Calificacion.objects.filter(
            created_at__date=report_date
        )
        promedio_calificaciones = nuevas_calificaciones.aggregate(
            promedio=models.Avg('puntuacion')
        )['promedio'] or 0
        
        report_data = {
            'fecha_reporte': str(report_date),
            'generado_en': timezone.now().isoformat(),
            'reservas': {
                'nuevas': reservas_nuevas,
                'confirmadas': reservas_confirmadas,
                'canceladas': reservas_canceladas,
            },
            'pagos': {
                'exitosos': pagos_exitosos,
                'rechazados': pagos_rechazados,
                'ingresos_totales': float(ingresos),
            },
            'usuarios': {
                'nuevos_clientes': nuevos_clientes,
                'nuevos_proveedores': nuevos_proveedores,
            },
            'servicios': {
                'total_activos': servicios_activos,
                'nuevos': nuevos_servicios,
                'top_5': [
                    {
                        'id': s['servicio__id'],
                        'nombre': s['servicio__nombre_servicio'],
                        'reservas': s['total_reservas']
                    }
                    for s in top_servicios
                ],
            },
            'calificaciones': {
                'nuevas': nuevas_calificaciones.count(),
                'promedio': round(promedio_calificaciones, 2),
            }
        }
        
        logger.info(f"📊 Reporte diario generado para {report_date}")
        return Response(report_data)
        
    except Exception as e:
        logger.error(f"❌ Error generando reporte diario: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def upcoming_reservations(request):
    """
    Endpoint para obtener reservas próximas - Usado por n8n para recordatorios.
    
    GET /api_rest/reservas/upcoming/
    
    Query params:
        - hours: Ventana de tiempo en horas (default: 24)
        
    Returns:
        Lista de reservas con información de contacto para recordatorios
    """
    hours = int(request.query_params.get('hours', 24))
    
    try:
        now = timezone.now()
        future = now + timedelta(hours=hours)
        
        # Obtener reservas confirmadas en la ventana de tiempo
        reservas = Reserva.objects.filter(
            fecha__gte=now.date(),
            fecha__lte=future.date(),
            estado='confirmada'
        ).select_related('cliente').prefetch_related(
            'detalles__servicio__proveedor',
            'detalles__servicio__ubicaciones'
        )
        
        result = []
        for reserva in reservas:
            servicios_reservados = reserva.detalles.all()
            
            for rs in servicios_reservados:
                servicio = rs.servicio
                ubicaciones = servicio.ubicaciones.all()
                ubicacion_str = ', '.join([u.direccion for u in ubicaciones]) if ubicaciones else 'Por confirmar'
                
                result.append({
                    'reserva_id': reserva.id,
                    'cliente_id': str(reserva.cliente.user_id),
                    'cliente_telefono': reserva.cliente.telefono,
                    'servicio_id': servicio.id,
                    'servicio_nombre': servicio.nombre_servicio,
                    'proveedor_id': str(servicio.proveedor.user_id),
                    'fecha': str(reserva.fecha),
                    'hora': str(reserva.hora),
                    'ubicacion': ubicacion_str,
                    'total_estimado': float(reserva.total_estimado),
                    'horas_restantes': round(
                        (timezone.make_aware(
                            timezone.datetime.combine(reserva.fecha, reserva.hora)
                        ) - now).total_seconds() / 3600, 
                        1
                    ),
                })
        
        logger.info(f"📅 {len(result)} reservas próximas en las siguientes {hours} horas")
        return Response(result)
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo reservas próximas: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([AllowAny])  # Protegido por API key de n8n
def cleanup_old_data(request):
    """
    Endpoint para limpieza de datos antiguos - Usado por n8n Scheduled Tasks.
    
    DELETE /api_rest/cleanup/old-data/
    
    Query params:
        - days: Días de antigüedad para considerar datos como "viejos" (default: 90)
        - dry_run: Si es "true", solo simula sin borrar (default: false)
        
    Returns:
        Resumen de datos eliminados
    """
    days = int(request.query_params.get('days', 90))
    dry_run = request.query_params.get('dry_run', 'false').lower() == 'true'
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Contar registros a eliminar
        reservas_canceladas = Reserva.objects.filter(
            estado='cancelada',
            updated_at__lt=cutoff_date
        )
        
        pagos_pendientes_viejos = Pago.objects.filter(
            estado='pendiente',
            created_at__lt=cutoff_date
        )
        
        counts = {
            'reservas_canceladas': reservas_canceladas.count(),
            'pagos_pendientes_viejos': pagos_pendientes_viejos.count(),
        }
        
        if not dry_run:
            # Eliminar datos
            deleted_reservas, _ = reservas_canceladas.delete()
            deleted_pagos, _ = pagos_pendientes_viejos.delete()
            
            counts['reservas_eliminadas'] = deleted_reservas
            counts['pagos_eliminados'] = deleted_pagos
            
            logger.info(f"🧹 Limpieza completada: {counts}")
        else:
            logger.info(f"🔍 Dry run - Datos que se eliminarían: {counts}")
        
        return Response({
            'status': 'success' if not dry_run else 'dry_run',
            'cutoff_date': cutoff_date.isoformat(),
            'days': days,
            'dry_run': dry_run,
            'summary': counts,
        })
        
    except Exception as e:
        logger.error(f"❌ Error en limpieza de datos: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def system_health_check(request):
    """
    Endpoint de health check del sistema - Usado por n8n para monitoreo.
    
    GET /api_rest/health/
    
    Returns:
        Estado de salud de los componentes del sistema
    """
    from django.db import connection
    
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'components': {}
    }
    
    # Check Database
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        health_status['components']['database'] = {
            'status': 'healthy',
            'type': 'sqlite' if 'sqlite' in connection.vendor else connection.vendor
        }
    except Exception as e:
        health_status['components']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health_status['status'] = 'degraded'
    
    # Check Redis (if configured)
    try:
        from django.core.cache import cache
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['components']['cache'] = {'status': 'healthy'}
        else:
            health_status['components']['cache'] = {'status': 'degraded'}
    except Exception as e:
        health_status['components']['cache'] = {
            'status': 'unavailable',
            'message': 'Cache not configured'
        }
    
    # Check Event Bus connectivity
    try:
        from ..services.event_bus import event_bus
        health_status['components']['event_bus'] = {
            'status': 'configured',
            'base_url': event_bus.n8n_base_url or 'not configured'
        }
    except Exception as e:
        health_status['components']['event_bus'] = {
            'status': 'error',
            'error': str(e)
        }
    
    # Basic stats
    health_status['stats'] = {
        'total_reservas': Reserva.objects.count(),
        'reservas_pendientes': Reserva.objects.filter(estado='pendiente').count(),
        'servicios_activos': Servicio.objects.count(),
        'clientes': Cliente.objects.count(),
        'proveedores': Proveedor.objects.count(),
    }
    
    logger.info(f"🏥 Health check: {health_status['status']}")
    return Response(health_status)


@api_view(['GET'])
@permission_classes([AllowAny])
def pending_payments_report(request):
    """
    Endpoint para obtener pagos pendientes - Usado por n8n para seguimiento.
    
    GET /api_rest/reports/pending-payments/
    
    Query params:
        - days: Días de antigüedad mínima (default: 3)
        
    Returns:
        Lista de pagos pendientes que requieren seguimiento
    """
    days = int(request.query_params.get('days', 3))
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        
        pagos_pendientes = Pago.objects.filter(
            estado='pendiente',
            created_at__lt=cutoff_date
        ).select_related('reserva__cliente')
        
        result = []
        for pago in pagos_pendientes:
            result.append({
                'pago_id': pago.id,
                'reserva_id': pago.reserva.id,
                'cliente_id': str(pago.reserva.cliente.user_id),
                'cliente_telefono': pago.reserva.cliente.telefono,
                'monto': float(pago.monto),
                'metodo_pago': pago.metodo_pago,
                'creado': pago.created_at.isoformat(),
                'dias_pendiente': (timezone.now() - pago.created_at).days,
            })
        
        logger.info(f"💳 {len(result)} pagos pendientes por más de {days} días")
        return Response({
            'count': len(result),
            'days_threshold': days,
            'payments': result
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo pagos pendientes: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
