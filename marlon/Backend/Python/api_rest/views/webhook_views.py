"""
Webhook Views - Endpoints para recibir webhooks externos
=========================================================
Pilar 4: n8n - Event Bus

Estos endpoints reciben eventos de:
1. Pasarelas de pago (Stripe, PayU, MercadoPago)
2. Partners externos
3. Canales de mensajería (Telegram, Email)
4. Triggers de tareas programadas

Todos los eventos se redirigen al Event Bus (n8n) para procesamiento.
"""
import json
import hashlib
import hmac
import logging
from datetime import datetime
from typing import Optional

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..services.event_bus import event_bus
from ..models import Pago, Reserva

logger = logging.getLogger(__name__)


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verifica la firma HMAC-SHA256 de un webhook.
    
    Args:
        payload: Body del request en bytes
        signature: Firma del header (con o sin prefijo sha256=)
        secret: Secreto compartido
        
    Returns:
        bool: True si la firma es válida
    """
    expected = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    # Soportar formato "sha256=xxx" o solo "xxx"
    if signature.startswith('sha256='):
        return hmac.compare_digest(f"sha256={expected}", signature)
    return hmac.compare_digest(expected, signature)


# ========================================
# WORKFLOW 1: Payment Webhook Handler
# ========================================

@csrf_exempt
@require_POST
def payment_webhook_stripe(request):
    """
    Endpoint para recibir webhooks de Stripe.
    
    Headers requeridos:
        - Stripe-Signature: Firma del webhook
        
    El workflow en n8n se encarga de:
    1. Validar payload completo
    2. Actualizar estado de pago/reserva
    3. Notificar via WebSocket
    4. Enviar email de confirmación
    5. Notificar al partner si aplica
    """
    try:
        # Verificar firma
        signature = request.headers.get('Stripe-Signature', '')
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
        
        if webhook_secret and signature:
            # Stripe usa formato especial de firma
            try:
                import stripe
                stripe.Webhook.construct_event(
                    request.body,
                    signature,
                    webhook_secret
                )
            except Exception as e:
                logger.warning(f"⚠️ Firma de Stripe inválida: {e}")
                return JsonResponse({'error': 'Invalid signature'}, status=401)
        
        # Parsear payload
        payload = json.loads(request.body)
        event_type = payload.get('type', 'unknown')
        
        logger.info(f"📥 Webhook de Stripe recibido: {event_type}")
        
        # Extraer datos del pago
        payment_object = payload.get('data', {}).get('object', {})
        metadata = payment_object.get('metadata', {})
        
        payment_data = {
            'gateway': 'stripe',
            'transaction_id': payload.get('id'),
            'type': event_type,
            'amount': payment_object.get('amount', 0) / 100,  # Stripe usa centavos
            'currency': payment_object.get('currency', 'usd').upper(),
            'status': payment_object.get('status'),
            'reserva_id': metadata.get('reserva_id'),
            'cliente_id': metadata.get('cliente_id'),
            'proveedor_id': metadata.get('proveedor_id'),
            'method': payment_object.get('payment_method_types', ['unknown'])[0],
            'metadata': metadata,
            'raw_event_type': event_type
        }
        
        # Enviar al Event Bus
        success = event_bus.emit_payment_received(payment_data)
        
        return JsonResponse({
            'status': 'received',
            'event_type': event_type,
            'forwarded': success
        })
            
    except json.JSONDecodeError:
        logger.error("❌ Payload de Stripe inválido")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.exception(f"❌ Error procesando webhook de Stripe: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def payment_webhook_payu(request):
    """
    Endpoint para recibir webhooks de PayU Latam.
    """
    try:
        # PayU envía datos como form-data o JSON
        if request.content_type == 'application/json':
            payload = json.loads(request.body)
        else:
            payload = dict(request.POST)
        
        # Verificar firma de PayU
        merchant_id = getattr(settings, 'PAYU_MERCHANT_ID', '')
        api_key = getattr(settings, 'PAYU_API_KEY', '')
        
        if merchant_id and api_key:
            # Verificar firma MD5 de PayU
            reference = payload.get('reference_sale', '')
            value = payload.get('value', '')
            currency = payload.get('currency', '')
            state = payload.get('state_pol', '')
            
            sign_string = f"{api_key}~{merchant_id}~{reference}~{value}~{currency}~{state}"
            expected_sign = hashlib.md5(sign_string.encode()).hexdigest()
            
            received_sign = payload.get('signature', '')
            if received_sign and not hmac.compare_digest(expected_sign, received_sign):
                logger.warning("⚠️ Firma de PayU inválida")
                return JsonResponse({'error': 'Invalid signature'}, status=401)
        
        logger.info(f"📥 Webhook de PayU recibido: {payload.get('state_pol')}")
        
        payment_data = {
            'gateway': 'payu',
            'transaction_id': payload.get('transaction_id', payload.get('transactionId')),
            'type': 'payment.payu',
            'amount': float(payload.get('value', 0)),
            'currency': payload.get('currency', 'COP'),
            'status': payload.get('state_pol'),
            'reserva_id': payload.get('reference_sale', '').split('-')[0] if '-' in str(payload.get('reference_sale', '')) else None,
            'method': payload.get('payment_method_name', 'unknown'),
            'metadata': payload
        }
        
        success = event_bus.emit_payment_received(payment_data)
        
        return JsonResponse({'status': 'received', 'forwarded': success})
        
    except Exception as e:
        logger.exception(f"❌ Error procesando webhook de PayU: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def payment_webhook_mercadopago(request):
    """
    Endpoint para recibir webhooks de MercadoPago.
    """
    try:
        payload = json.loads(request.body)
        
        # Verificar que sea una notificación de pago
        topic = request.GET.get('topic', payload.get('type', ''))
        
        logger.info(f"📥 Webhook de MercadoPago recibido: {topic}")
        
        # MercadoPago envía solo el ID, hay que consultar detalles
        payment_id = payload.get('data', {}).get('id')
        
        payment_data = {
            'gateway': 'mercadopago',
            'transaction_id': str(payment_id),
            'type': f'payment.mercadopago.{topic}',
            'action': payload.get('action'),
            'api_version': payload.get('api_version'),
            'metadata': payload
        }
        
        success = event_bus.emit_payment_received(payment_data)
        
        return JsonResponse({'status': 'received', 'forwarded': success})
        
    except Exception as e:
        logger.exception(f"❌ Error procesando webhook de MercadoPago: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def payment_webhook_generic(request):
    """
    Endpoint genérico para webhooks de pago no específicos.
    """
    try:
        payload = json.loads(request.body)
        gateway = request.headers.get('X-Payment-Gateway', 'generic')
        
        logger.info(f"📥 Webhook de pago genérico recibido: {gateway}")
        
        payment_data = {
            'gateway': gateway,
            'transaction_id': payload.get('transaction_id', payload.get('id')),
            'type': 'payment.generic',
            'amount': payload.get('amount', 0),
            'currency': payload.get('currency', 'COP'),
            'status': payload.get('status'),
            'reserva_id': payload.get('reserva_id', payload.get('reference')),
            'metadata': payload
        }
        
        success = event_bus.emit_payment_received(payment_data)
        
        return JsonResponse({'status': 'received', 'forwarded': success})
        
    except Exception as e:
        logger.exception(f"❌ Error procesando webhook de pago: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# ========================================
# WORKFLOW 2: Partner Webhook Handler
# ========================================

@csrf_exempt
@require_POST
def partner_webhook(request):
    """
    Endpoint para recibir webhooks del grupo partner.
    
    Headers requeridos:
        - X-Partner-Signature: Firma HMAC-SHA256
        - X-Partner-ID: ID del partner (opcional)
        
    Responde con ACK inmediatamente.
    """
    try:
        # Verificar firma HMAC
        signature = request.headers.get('X-Partner-Signature', '')
        partner_id = request.headers.get('X-Partner-ID', 'unknown')
        
        if not signature:
            logger.warning(f"⚠️ Webhook de partner sin firma: {partner_id}")
            return JsonResponse({'error': 'Missing signature'}, status=401)
        
        # Parsear payload
        payload = json.loads(request.body)
        
        # Verificar firma
        if not event_bus.verify_partner_signature(payload, signature):
            logger.warning(f"⚠️ Firma de partner inválida: {partner_id}")
            return JsonResponse({'error': 'Invalid signature'}, status=401)
        
        event_type = payload.get('event_type', 'unknown')
        logger.info(f"📥 Webhook de partner {partner_id}: {event_type}")
        
        # Mapear tipo de evento a webhook path
        partner_events = {
            'partner.sync_request': 'partner-sync',
            'partner.data_update': 'partner-update',
            'partner.notification': 'partner-notify',
            'partner.availability_check': 'partner-availability',
            'partner.booking_request': 'partner-booking'
        }
        
        # ================================================
        # Handlers específicos para eventos de Chuwue Grill
        # ================================================
        chuwue_events = {
            'event.reservation_confirmed': handle_chuwue_event_confirmed,
            'event.updated': handle_chuwue_event_updated,
            'event.cancelled': handle_chuwue_event_cancelled,
            'payment.success': handle_chuwue_payment_success,
        }
        
        # Verificar si es un evento de Chuwue Grill
        if event_type in chuwue_events:
            handler = chuwue_events[event_type]
            result = handler(payload.get('data', {}), partner_id)
            return JsonResponse({
                'status': 'processed',
                'event_type': event_type,
                'partner_id': partner_id,
                'result': result
            })
        
        webhook_path = partner_events.get(event_type, 'partner-generic')
        
        # Enriquecer payload
        enriched_payload = {
            **payload,
            'partner_id': partner_id,
            'received_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Enviar al Event Bus
        success = event_bus._send_to_n8n(webhook_path, enriched_payload)
        
        # Responder ACK inmediatamente
        return JsonResponse({
            'status': 'ack',
            'received_at': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'partner_id': partner_id,
            'processed': success
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.exception(f"❌ Error procesando webhook de partner: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# ========================================
# WORKFLOW 3: MCP Input Handler
# ========================================

@csrf_exempt
@require_POST  
def telegram_webhook(request):
    """
    Endpoint para recibir mensajes del Telegram Bot.
    
    Los redirige a n8n que:
    1. Extrae contenido y adjuntos
    2. Envía al AI Orchestrator
    3. Responde por Telegram
    """
    try:
        payload = json.loads(request.body)
        
        # Telegram puede enviar diferentes tipos de updates
        message = payload.get('message', {})
        callback_query = payload.get('callback_query', {})
        
        if callback_query:
            # Es un callback de botón inline
            chat_id = callback_query.get('message', {}).get('chat', {}).get('id')
            text = callback_query.get('data', '')
            sender = callback_query.get('from', {})
            message_type = 'callback'
        elif message:
            chat_id = message.get('chat', {}).get('id')
            text = message.get('text', '')
            sender = message.get('from', {})
            message_type = 'message'
        else:
            return JsonResponse({'ok': True, 'skipped': True})
        
        # Extraer adjuntos
        attachments = []
        if 'photo' in message:
            # Telegram envía array de resoluciones, usar la mejor
            attachments.append({
                'type': 'photo',
                'file_id': message['photo'][-1]['file_id'],
                'file_size': message['photo'][-1].get('file_size')
            })
        if 'document' in message:
            attachments.append({
                'type': 'document',
                'file_id': message['document']['file_id'],
                'file_name': message['document'].get('file_name'),
                'mime_type': message['document'].get('mime_type')
            })
        if 'voice' in message:
            attachments.append({
                'type': 'voice',
                'file_id': message['voice']['file_id'],
                'duration': message['voice'].get('duration')
            })
        if 'audio' in message:
            attachments.append({
                'type': 'audio',
                'file_id': message['audio']['file_id'],
                'title': message['audio'].get('title')
            })
        if 'location' in message:
            attachments.append({
                'type': 'location',
                'latitude': message['location']['latitude'],
                'longitude': message['location']['longitude']
            })
        
        logger.info(f"📱 Mensaje de Telegram: {sender.get('username', chat_id)} - {message_type}")
        
        # Enviar al Event Bus
        success = event_bus.emit_mcp_message(
            channel='telegram',
            message=text,
            sender_id=str(chat_id),
            attachments=attachments,
            metadata={
                'username': sender.get('username'),
                'first_name': sender.get('first_name'),
                'last_name': sender.get('last_name'),
                'language_code': sender.get('language_code'),
                'message_id': message.get('message_id'),
                'message_type': message_type,
                'chat_type': message.get('chat', {}).get('type')
            }
        )
        
        return JsonResponse({'ok': True, 'forwarded': success})
        
    except Exception as e:
        logger.exception(f"❌ Error procesando mensaje de Telegram: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def email_webhook(request):
    """
    Endpoint para recibir emails (via SendGrid, Mailgun, etc).
    """
    try:
        # El formato depende del proveedor
        content_type = request.content_type
        
        if 'multipart/form-data' in content_type:
            # SendGrid Inbound Parse
            sender_email = request.POST.get('from', '')
            subject = request.POST.get('subject', '')
            body = request.POST.get('text', request.POST.get('html', ''))
            headers = request.POST.get('headers', '')
            
            attachments = []
            for key in request.FILES:
                file = request.FILES[key]
                attachments.append({
                    'type': 'email_attachment',
                    'filename': file.name,
                    'content_type': file.content_type,
                    'size': file.size
                })
        else:
            # JSON format (Mailgun, custom)
            payload = json.loads(request.body)
            sender_email = payload.get('from', payload.get('sender', ''))
            subject = payload.get('subject', '')
            body = payload.get('text', payload.get('body', payload.get('html', '')))
            
            attachments = []
            for att in payload.get('attachments', []):
                attachments.append({
                    'type': 'email_attachment',
                    'filename': att.get('filename'),
                    'content_type': att.get('content_type'),
                    'url': att.get('url'),
                    'size': att.get('size')
                })
        
        logger.info(f"📧 Email recibido de: {sender_email}")
        
        success = event_bus.emit_mcp_message(
            channel='email',
            message=f"Subject: {subject}\n\n{body}",
            sender_id=sender_email,
            attachments=attachments,
            metadata={
                'subject': subject,
                'raw_from': sender_email
            }
        )
        
        return JsonResponse({'received': True, 'forwarded': success})
        
    except Exception as e:
        logger.exception(f"❌ Error procesando email: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def whatsapp_webhook(request):
    """
    Endpoint para recibir mensajes de WhatsApp Business API.
    """
    try:
        payload = json.loads(request.body)
        
        # Verificar token de verificación para webhook setup
        if request.method == 'GET':
            mode = request.GET.get('hub.mode')
            token = request.GET.get('hub.verify_token')
            challenge = request.GET.get('hub.challenge')
            
            verify_token = getattr(settings, 'WHATSAPP_VERIFY_TOKEN', '')
            
            if mode == 'subscribe' and token == verify_token:
                return JsonResponse(int(challenge), safe=False)
            return JsonResponse({'error': 'Invalid token'}, status=403)
        
        # Procesar mensaje entrante
        entry = payload.get('entry', [{}])[0]
        changes = entry.get('changes', [{}])[0]
        value = changes.get('value', {})
        messages = value.get('messages', [])
        
        if not messages:
            return JsonResponse({'ok': True, 'skipped': True})
        
        message = messages[0]
        phone_number = message.get('from')
        message_type = message.get('type')
        
        # Extraer contenido según tipo
        if message_type == 'text':
            text = message.get('text', {}).get('body', '')
        elif message_type == 'button':
            text = message.get('button', {}).get('text', '')
        elif message_type == 'interactive':
            interactive = message.get('interactive', {})
            if interactive.get('type') == 'button_reply':
                text = interactive.get('button_reply', {}).get('title', '')
            else:
                text = interactive.get('list_reply', {}).get('title', '')
        else:
            text = f"[{message_type}]"
        
        # Extraer adjuntos
        attachments = []
        for media_type in ['image', 'document', 'audio', 'video', 'sticker']:
            if media_type in message:
                media = message[media_type]
                attachments.append({
                    'type': media_type,
                    'media_id': media.get('id'),
                    'mime_type': media.get('mime_type'),
                    'caption': media.get('caption')
                })
        
        if 'location' in message:
            loc = message['location']
            attachments.append({
                'type': 'location',
                'latitude': loc.get('latitude'),
                'longitude': loc.get('longitude'),
                'name': loc.get('name'),
                'address': loc.get('address')
            })
        
        logger.info(f"📱 WhatsApp de: {phone_number}")
        
        success = event_bus.emit_mcp_message(
            channel='whatsapp',
            message=text,
            sender_id=phone_number,
            attachments=attachments,
            metadata={
                'message_id': message.get('id'),
                'message_type': message_type,
                'timestamp': message.get('timestamp'),
                'context': message.get('context')  # Para replies
            }
        )
        
        return JsonResponse({'ok': True, 'forwarded': success})
        
    except Exception as e:
        logger.exception(f"❌ Error procesando WhatsApp: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def whatsapp_verify(request):
    """
    Endpoint GET para verificación del webhook de WhatsApp.
    """
    if request.method == 'GET':
        mode = request.GET.get('hub.mode')
        token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')
        
        verify_token = getattr(settings, 'WHATSAPP_VERIFY_TOKEN', '')
        
        if mode == 'subscribe' and token == verify_token:
            logger.info("✅ WhatsApp webhook verificado")
            return JsonResponse(int(challenge), safe=False)
        
        logger.warning("⚠️ WhatsApp verificación fallida")
        return JsonResponse({'error': 'Invalid token'}, status=403)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ========================================
# WORKFLOW 4: Scheduled Tasks Trigger
# ========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_scheduled_task(request):
    """
    Endpoint para disparar tareas programadas manualmente.
    Requiere autenticación.
    
    Body:
        - task: Nombre de la tarea
        - params: Parámetros opcionales
        - priority: Prioridad ('low', 'normal', 'high')
    """
    task_name = request.data.get('task')
    params = request.data.get('params', {})
    priority = request.data.get('priority', 'normal')
    
    if not task_name:
        return Response(
            {'error': 'task name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    valid_tasks = [
        'daily_report',          # Reporte diario
        'cleanup_old_data',      # Limpieza de datos
        'send_reminders',        # Envío de recordatorios
        'health_check',          # Health checks
        'sync_partners',         # Sincronización con partners
        'process_pending_payments',  # Procesar pagos pendientes
        'update_ratings',        # Actualizar ratings promedio
        'generate_invoices',     # Generar facturas
        'backup_database'        # Backup de BD
    ]
    
    if task_name not in valid_tasks:
        return Response(
            {'error': f'Invalid task. Valid tasks: {valid_tasks}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    logger.info(f"🔧 Tarea manual disparada: {task_name} por user {request.user.id}")
    
    success = event_bus.trigger_scheduled_task(task_name, params, priority)
    
    if success:
        return Response({
            'status': 'triggered',
            'task': task_name,
            'params': params,
            'priority': priority,
            'triggered_by': request.user.id
        })
    else:
        return Response(
            {'error': 'Failed to trigger task'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def list_available_tasks(request):
    """Lista las tareas programadas disponibles."""
    tasks = [
        {
            'name': 'daily_report',
            'description': 'Genera y envía el reporte diario',
            'schedule': '0 8 * * *'  # 8 AM diario
        },
        {
            'name': 'cleanup_old_data',
            'description': 'Limpia datos antiguos y logs',
            'schedule': '0 3 * * *'  # 3 AM diario
        },
        {
            'name': 'send_reminders',
            'description': 'Envía recordatorios de reservas',
            'schedule': '0 9,18 * * *'  # 9 AM y 6 PM
        },
        {
            'name': 'health_check',
            'description': 'Verifica salud de todos los servicios',
            'schedule': '*/5 * * * *'  # Cada 5 minutos
        },
        {
            'name': 'sync_partners',
            'description': 'Sincroniza datos con partners',
            'schedule': '0 */6 * * *'  # Cada 6 horas
        },
        {
            'name': 'process_pending_payments',
            'description': 'Procesa pagos pendientes de verificación',
            'schedule': '*/15 * * * *'  # Cada 15 minutos
        },
        {
            'name': 'update_ratings',
            'description': 'Recalcula ratings promedio de servicios',
            'schedule': '0 4 * * *'  # 4 AM diario
        },
        {
            'name': 'generate_invoices',
            'description': 'Genera facturas pendientes',
            'schedule': '0 0 1 * *'  # Primer día del mes
        },
        {
            'name': 'backup_database',
            'description': 'Backup de base de datos',
            'schedule': '0 2 * * *'  # 2 AM diario
        }
    ]
    
    return Response({'tasks': tasks})


# ========================================
# Health Check & Callbacks
# ========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def n8n_health(request):
    """Endpoint de salud para que n8n verifique la conexión."""
    return Response({
        'status': 'healthy',
        'service': 'findyourwork-django',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'endpoints': {
            'payments': '/webhooks/payments/',
            'partner': '/webhooks/partner/',
            'telegram': '/webhooks/telegram/',
            'email': '/webhooks/email/',
            'whatsapp': '/webhooks/whatsapp/',
            'tasks': '/webhooks/tasks/'
        }
    })


@csrf_exempt
@require_POST
def n8n_callback(request):
    """
    Endpoint para recibir callbacks de n8n después de procesar eventos.
    Útil para actualizar estado en Django después de procesamiento async.
    """
    try:
        payload = json.loads(request.body)
        
        callback_type = payload.get('callback_type')
        original_event = payload.get('original_event')
        result = payload.get('result', {})
        
        logger.info(f"📥 Callback de n8n: {callback_type}")
        
        # Procesar según tipo de callback
        if callback_type == 'payment.processed':
            # Actualizar estado de pago en Django
            pago_id = result.get('pago_id')
            new_status = result.get('status')
            if pago_id and new_status:
                try:
                    pago = Pago.objects.get(id=pago_id)
                    pago.estado = new_status
                    pago.save()
                    logger.info(f"✅ Pago {pago_id} actualizado a {new_status}")
                except Pago.DoesNotExist:
                    logger.warning(f"⚠️ Pago {pago_id} no encontrado")
                    
        elif callback_type == 'reservation.activated':
            # Activar reserva
            reserva_id = result.get('reserva_id')
            if reserva_id:
                try:
                    reserva = Reserva.objects.get(id=reserva_id)
                    reserva.estado = 'confirmada'
                    reserva.save()
                    logger.info(f"✅ Reserva {reserva_id} activada")
                except Reserva.DoesNotExist:
                    logger.warning(f"⚠️ Reserva {reserva_id} no encontrada")
        
        return JsonResponse({
            'status': 'processed',
            'callback_type': callback_type
        })
        
    except Exception as e:
        logger.exception(f"❌ Error procesando callback de n8n: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# ========================================
# SIMULADOR DE PAGOS PARA TESTING
# ========================================

@csrf_exempt
@require_POST  
def simulate_payment_webhook(request):
    """
    Endpoint para simular un webhook de pasarela de pago.
    Usado desde el frontend para probar la integración con n8n.
    
    POST /webhooks/payments/simulate/
    
    Body:
    {
        "type": "payment_intent.succeeded",
        "provider": "stripe_simulator",
        "data": {
            "object": {
                "id": "pi_simulated_123",
                "amount": 5000,
                "currency": "usd",
                "status": "succeeded",
                "metadata": {
                    "reserva_id": 1,
                    "pago_id": 1
                }
            }
        }
    }
    
    Este endpoint:
    1. Recibe el webhook simulado del frontend
    2. Actualiza el pago en la BD a "pagado"
    3. Actualiza la reserva a "confirmada"
    4. Envía el evento a n8n para orquestación
    5. Retorna el resultado al frontend
    """
    try:
        payload = json.loads(request.body)
        
        event_type = payload.get('type', 'unknown')
        provider = payload.get('provider', 'simulator')
        data_object = payload.get('data', {}).get('object', {})
        metadata = data_object.get('metadata', {})
        
        logger.info(f"🧪 Webhook SIMULADO recibido: {event_type} de {provider}")
        
        pago_id = metadata.get('pago_id')
        reserva_id = metadata.get('reserva_id')
        
        result = {
            'status': 'processed',
            'event_type': event_type,
            'pago_id': pago_id,
            'reserva_id': reserva_id,
            'actions': []
        }
        
        # 1. Actualizar pago a "pagado"
        if pago_id:
            try:
                pago = Pago.objects.get(id=pago_id)
                pago.estado = 'pagado'
                pago.referencia = data_object.get('id', f'SIM-{pago_id}')
                pago.fecha_pago = timezone.now()
                pago.save()
                result['actions'].append(f'Pago {pago_id} marcado como pagado')
                logger.info(f"✅ Pago {pago_id} actualizado a 'pagado'")
                
                # Obtener reserva del pago si no se especificó
                if not reserva_id:
                    reserva_id = pago.reserva_id
            except Pago.DoesNotExist:
                result['actions'].append(f'Pago {pago_id} no encontrado')
                logger.warning(f"⚠️ Pago {pago_id} no encontrado")
        
        # 2. Actualizar reserva a "confirmada"
        if reserva_id:
            try:
                reserva = Reserva.objects.get(id=reserva_id)
                reserva.estado = 'confirmada'
                reserva.save()
                result['actions'].append(f'Reserva {reserva_id} confirmada')
                logger.info(f"✅ Reserva {reserva_id} confirmada")
            except Reserva.DoesNotExist:
                result['actions'].append(f'Reserva {reserva_id} no encontrada')
                logger.warning(f"⚠️ Reserva {reserva_id} no encontrada")
        
        # 3. Enviar evento a n8n Event Bus
        try:
            payment_data = {
                'gateway': provider,
                'transaction_id': data_object.get('id'),
                'type': event_type,
                'amount': data_object.get('amount', 0) / 100,
                'currency': data_object.get('currency', 'usd').upper(),
                'status': data_object.get('status', 'succeeded'),
                'reserva_id': reserva_id,
                'pago_id': pago_id,
                'metadata': metadata,
                'simulated': True
            }
            
            n8n_result = event_bus.emit_payment_received(payment_data)
            result['n8n_notified'] = n8n_result
            result['actions'].append('Evento enviado a n8n Event Bus')
            logger.info(f"📤 Evento enviado a n8n: {n8n_result}")
        except Exception as n8n_err:
            result['n8n_notified'] = False
            result['n8n_error'] = str(n8n_err)
            result['actions'].append(f'Error enviando a n8n: {n8n_err}')
            logger.warning(f"⚠️ No se pudo notificar a n8n: {n8n_err}")
        
        return JsonResponse(result)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.exception(f"❌ Error en simulación de pago: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_test_page(request):
    """
    Endpoint de prueba que muestra información sobre cómo probar los pagos.
    GET /webhooks/payments/test/
    """
    return Response({
        'message': 'Sistema de pagos FindYourWork',
        'endpoints': {
            'stripe': '/webhooks/payments/stripe/',
            'payu': '/webhooks/payments/payu/',
            'mercadopago': '/webhooks/payments/mercadopago/',
            'generic': '/webhooks/payments/',
            'simulate': '/webhooks/payments/simulate/'
        },
        'simulate_example': {
            'method': 'POST',
            'url': '/webhooks/payments/simulate/',
            'body': {
                'type': 'payment_intent.succeeded',
                'provider': 'stripe_simulator',
                'data': {
                    'object': {
                        'id': 'pi_test_123',
                        'amount': 5000,
                        'currency': 'usd',
                        'status': 'succeeded',
                        'metadata': {
                            'reserva_id': 1,
                            'pago_id': 1
                        }
                    }
                }
            }
        },
        'n8n_status': 'Check http://localhost:5678 for n8n dashboard'
    })


# ========================================
# HANDLERS PARA EVENTOS DE CHUWUE GRILL
# ========================================

def handle_chuwue_event_confirmed(data: dict, partner_id: str) -> dict:
    """
    Procesa evento de reserva confirmada desde Chuwue Grill.
    
    Cuando Chuwue confirma un evento corporativo, FindyourWork puede:
    1. Mostrar servicios disponibles al cliente
    2. Enviar notificación a proveedores cercanos
    3. Crear oportunidad de negocio
    """
    reservation_id = data.get('reservation_id')
    event_name = data.get('event_name')
    date = data.get('date')
    guests = data.get('guests')
    services_requested = data.get('services_requested', [])
    
    logger.info(f"🎉 Evento confirmado de Chuwue Grill: {event_name}")
    logger.info(f"   - ID: {reservation_id}")
    logger.info(f"   - Fecha: {date}")
    logger.info(f"   - Invitados: {guests}")
    logger.info(f"   - Servicios solicitados: {services_requested}")
    
    # Aquí iría la lógica de negocio:
    # - Buscar proveedores disponibles para esa fecha
    # - Crear oportunidad en el sistema
    # - Notificar a proveedores relevantes
    
    return {
        'status': 'received',
        'reservation_id': reservation_id,
        'services_requested': services_requested,
        'message': 'Evento registrado, buscando proveedores disponibles'
    }


def handle_chuwue_event_updated(data: dict, partner_id: str) -> dict:
    """
    Procesa actualización de evento desde Chuwue Grill.
    """
    reservation_id = data.get('reservation_id')
    changes = data.get('changes', {})
    
    logger.info(f"📝 Evento actualizado de Chuwue Grill: {reservation_id}")
    logger.info(f"   - Cambios: {changes}")
    
    # Actualizar servicios contratados si es necesario
    # Notificar a proveedores afectados
    
    return {
        'status': 'updated',
        'reservation_id': reservation_id,
        'changes_applied': list(changes.keys())
    }


def handle_chuwue_event_cancelled(data: dict, partner_id: str) -> dict:
    """
    Procesa cancelación de evento desde Chuwue Grill.
    """
    reservation_id = data.get('reservation_id')
    reason = data.get('reason', 'No especificado')
    
    logger.info(f"❌ Evento cancelado de Chuwue Grill: {reservation_id}")
    logger.info(f"   - Razón: {reason}")
    
    # Cancelar servicios asociados
    # Notificar a proveedores
    # Procesar reembolsos si aplica
    
    return {
        'status': 'cancelled',
        'reservation_id': reservation_id,
        'reason': reason,
        'message': 'Servicios asociados serán cancelados'
    }


def handle_chuwue_payment_success(data: dict, partner_id: str) -> dict:
    """
    Procesa confirmación de pago desde Chuwue Grill.
    """
    reservation_id = data.get('reservation_id')
    amount = data.get('amount')
    
    logger.info(f"💰 Pago confirmado de Chuwue Grill: {reservation_id}")
    logger.info(f"   - Monto: ${amount}")
    
    # Confirmar servicios asociados
    # Activar proveedores
    
    return {
        'status': 'payment_received',
        'reservation_id': reservation_id,
        'amount': amount,
        'message': 'Servicios confirmados'
    }
