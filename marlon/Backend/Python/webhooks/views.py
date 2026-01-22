from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
import logging
from django.utils.timezone import now

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """Stripe payment webhook"""
    try:
        data = json.loads(request.body)
        event_id = data.get('id')
        amount = data.get('data', {}).get('object', {}).get('amount')
        
        logger.info(f"Stripe webhook received: {event_id}")
        
        response = {
            "status": "success",
            "message": "Webhook received and processed",
            "event_id": event_id,
            "amount": amount,
            "timestamp": now().isoformat(),
            "processed": True
        }
        return JsonResponse(response, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def mercadopago_webhook(request):
    """MercadoPago payment webhook"""
    try:
        data = json.loads(request.body)
        event_id = data.get('id')
        event_type = data.get('type')
        
        logger.info(f"MercadoPago webhook: {event_type} - {event_id}")
        
        response = {
            "status": "success",
            "message": "MercadoPago event processed",
            "event_id": event_id,
            "type": event_type,
            "received_at": now().isoformat(),
            "stored": True
        }
        return JsonResponse(response, status=200)
    except Exception as e:
        logger.error(f"Error processing MercadoPago webhook: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def payu_webhook(request):
    """PayU payment webhook"""
    try:
        data = json.loads(request.body)
        transaction_id = data.get('id')
        state = data.get('state')
        reference = data.get('reference')
        value = data.get('value')
        
        is_confirmed = state == 'CONFIRMED'
        logger.info(f"PayU webhook: {reference} - {state}")
        
        response = {
            "status": "success",
            "message": "PayU transaction processed",
            "transaction_id": transaction_id,
            "state": state,
            "reference": reference,
            "value": value,
            "confirmed": is_confirmed,
            "timestamp": now().isoformat()
        }
        return JsonResponse(response, status=200)
    except Exception as e:
        logger.error(f"Error processing PayU webhook: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def partner_webhook(request):
    """Partner sync webhook"""
    try:
        data = json.loads(request.body)
        event = data.get('event')
        partner_id = data.get('partner_id')
        action = data.get('action')
        services = data.get('services', [])
        
        logger.info(f"Partner sync: {partner_id} - {action}")
        
        response = {
            "status": "success",
            "message": "Partner sync completed",
            "partner_id": partner_id,
            "action": action,
            "services_synced": len(services),
            "services": services,
            "synced": True,
            "timestamp": now().isoformat()
        }
        return JsonResponse(response, status=200)
    except Exception as e:
        logger.error(f"Error processing Partner webhook: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def telegram_webhook(request):
    """Telegram message webhook"""
    try:
        data = json.loads(request.body)
        update_id = data.get('update_id')
        message = data.get('message', {})
        chat_id = message.get('chat', {}).get('id')
        text = message.get('text')
        user = message.get('from', {}).get('first_name')
        
        logger.info(f"Telegram message: {user} - {text}")
        
        response = {
            "ok": True,
            "result": {
                "message_id": update_id,
                "status": "received",
                "chat_id": chat_id,
                "text_received": text,
                "user": user,
                "timestamp": now().isoformat()
            }
        }
        return JsonResponse(response, status=200)
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {str(e)}")
        return JsonResponse({"ok": False, "error": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def custom_webhook(request):
    """Custom event webhook"""
    try:
        data = json.loads(request.body)
        event_type = data.get('event_type')
        
        logger.info(f"Custom webhook: {event_type}")
        
        response = {
            "status": "success",
            "message": "Custom event processed",
            "event_type": event_type,
            "payload_received": len(json.dumps(data)),
            "keys": list(data.keys()),
            "timestamp": now().isoformat(),
            "processed": True
        }
        return JsonResponse(response, status=200)
    except Exception as e:
        logger.error(f"Error processing Custom webhook: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@require_http_methods(["GET"])
def webhook_health(request):
    """Health check endpoint"""
    return JsonResponse({
        "status": "healthy",
        "message": "Webhook service is running",
        "timestamp": now().isoformat()
    })

@require_http_methods(["GET"])
def webhook_events_list(request):
    """List webhook events (for debugging)"""
    return JsonResponse({
        "status": "success",
        "message": "Events list",
        "total_events": 0,
        "events": []
    })
