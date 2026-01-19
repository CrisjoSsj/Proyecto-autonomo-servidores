"""
Webhook Dispatcher Service - Despacho de Webhooks B2B
=======================================================
Pilar 2: Webhooks e Interoperabilidad B2B

Este servicio se encarga de:
1. Despachar webhooks a todos los partners suscritos a un evento
2. Firmar los payloads con HMAC-SHA256
3. Manejar reintentos en caso de fallo
4. Registrar logs de entregas

Headers enviados:
- X-Signature: sha256=<firma_hmac>
- X-Timestamp: <timestamp_iso>
- X-Event-Type: <tipo_de_evento>
- X-Delivery-ID: <id_unico_entrega>
- Content-Type: application/json
"""
import json
import hashlib
import hmac
import logging
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor
from django.utils import timezone
from django.db import transaction

logger = logging.getLogger(__name__)


class WebhookDispatcher:
    """
    Servicio para despachar webhooks a partners B2B.
    
    Uso:
        from api_rest.services.webhooks import webhook_dispatcher
        
        # Despachar evento a todos los partners suscritos
        webhook_dispatcher.dispatch_event('booking.confirmed', data)
        
        # Obtener partners suscritos a un evento
        partners = webhook_dispatcher.get_subscribers('payment.success')
    """
    
    def __init__(self, timeout: int = 10, max_workers: int = 5):
        """
        Args:
            timeout: Timeout para las requests HTTP
            max_workers: Número de workers para envíos paralelos
        """
        self.timeout = timeout
        self.max_workers = max_workers
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
    
    def dispatch_event(
        self, 
        event_type: str, 
        data: Dict[str, Any],
        async_mode: bool = True
    ) -> List[str]:
        """
        Despacha un evento a todos los partners suscritos.
        
        Args:
            event_type: Tipo de evento (ej: 'booking.confirmed')
            data: Datos del evento
            async_mode: Si True, envía de forma asíncrona
            
        Returns:
            Lista de partner_codes a los que se enviará
        """
        from ..models import Partner, WebhookSubscription, WebhookDelivery, WebhookEventLog
        
        # Obtener partners suscritos a este evento
        subscriptions = WebhookSubscription.objects.filter(
            event_type=event_type,
            is_active=True,
            partner__status='active'
        ).select_related('partner')
        
        if not subscriptions.exists():
            logger.debug(f"No hay partners suscritos a '{event_type}'")
            return []
        
        partner_codes = []
        
        for subscription in subscriptions:
            partner = subscription.partner
            partner_codes.append(partner.code)
            
            # Preparar payload con metadata
            payload = self._build_payload(event_type, data, partner.code)
            
            # Crear registro de entrega
            delivery = WebhookDelivery.objects.create(
                partner=partner,
                event_type=event_type,
                payload=payload,
                status='pending'
            )
            
            # Log del evento saliente
            WebhookEventLog.objects.create(
                partner=partner,
                direction='outgoing',
                event_type=event_type,
                payload=payload,
                headers={
                    'X-Event-Type': event_type,
                    'X-Delivery-ID': str(delivery.id),
                }
            )
            
            if async_mode:
                # Envío asíncrono
                self._executor.submit(
                    self._send_webhook,
                    partner,
                    payload,
                    delivery
                )
            else:
                # Envío síncrono
                self._send_webhook(partner, payload, delivery)
        
        logger.info(f"📤 Evento '{event_type}' despachado a {len(partner_codes)} partners")
        return partner_codes
    
    def _build_payload(
        self, 
        event_type: str, 
        data: Dict[str, Any],
        partner_code: str
    ) -> Dict[str, Any]:
        """Construye el payload estándar del webhook"""
        return {
            "event": event_type,
            "timestamp": datetime.utcnow().isoformat() + 'Z',
            "source": "findyourwork",
            "target": partner_code,
            "data": data,
            "metadata": {
                "version": "1.0",
                "delivery_attempt": 1,
            }
        }
    
    def _sign_payload(self, payload: Dict[str, Any], secret: str) -> str:
        """
        Firma el payload con HMAC-SHA256.
        
        Args:
            payload: Payload a firmar
            secret: Secret del partner
            
        Returns:
            Firma en formato 'sha256=<hex>'
        """
        payload_str = json.dumps(payload, sort_keys=True, default=str)
        signature = hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"
    
    def _send_webhook(
        self, 
        partner, 
        payload: Dict[str, Any],
        delivery
    ) -> bool:
        """
        Envía el webhook a un partner específico.
        
        Args:
            partner: Instancia del modelo Partner
            payload: Payload a enviar
            delivery: Instancia del modelo WebhookDelivery
            
        Returns:
            True si se envió correctamente
        """
        from ..models import Partner
        
        try:
            timestamp = datetime.utcnow().isoformat() + 'Z'
            signature = self._sign_payload(payload, partner.webhook_secret)
            
            headers = {
                'Content-Type': 'application/json',
                'X-Signature': signature,
                'X-Timestamp': timestamp,
                'X-Event-Type': payload.get('event', ''),
                'X-Delivery-ID': str(delivery.id),
                'X-Source': 'findyourwork',
                'User-Agent': 'FindYourWork-Webhook/1.0',
            }
            
            logger.debug(f"📤 Enviando webhook a {partner.code}: {partner.webhook_url}")
            
            response = requests.post(
                partner.webhook_url,
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            # Actualizar estado de entrega
            if response.status_code in [200, 201, 202, 204]:
                delivery.mark_as_delivered(
                    response_code=response.status_code,
                    response_body=response.text[:1000]  # Limitar tamaño
                )
                
                # Actualizar última entrega del partner
                partner.last_webhook_at = timezone.now()
                partner.save(update_fields=['last_webhook_at'])
                
                logger.info(f"✅ Webhook entregado a {partner.code}: {response.status_code}")
                return True
            else:
                delivery.mark_as_failed(
                    error_message=f"HTTP {response.status_code}: {response.text[:500]}",
                    response_code=response.status_code
                )
                logger.warning(f"⚠️ Webhook rechazado por {partner.code}: {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            delivery.mark_as_failed(error_message="Timeout")
            logger.error(f"❌ Timeout enviando webhook a {partner.code}")
            return False
            
        except requests.exceptions.ConnectionError as e:
            delivery.mark_as_failed(error_message=f"Connection error: {str(e)}")
            logger.error(f"❌ Error de conexión a {partner.code}: {e}")
            return False
            
        except Exception as e:
            delivery.mark_as_failed(error_message=str(e))
            logger.exception(f"❌ Error enviando webhook a {partner.code}: {e}")
            return False
    
    def get_subscribers(self, event_type: str) -> List[Dict[str, str]]:
        """
        Obtiene la lista de partners suscritos a un evento.
        
        Args:
            event_type: Tipo de evento
            
        Returns:
            Lista de diccionarios con info de partners
        """
        from ..models import WebhookSubscription
        
        subscriptions = WebhookSubscription.objects.filter(
            event_type=event_type,
            is_active=True,
            partner__status='active'
        ).select_related('partner')
        
        return [
            {
                'partner_code': sub.partner.code,
                'partner_name': sub.partner.name,
                'webhook_url': sub.partner.webhook_url,
            }
            for sub in subscriptions
        ]
    
    def retry_failed_deliveries(self) -> int:
        """
        Reintenta las entregas fallidas programadas.
        
        Returns:
            Número de entregas reintentadas
        """
        from ..models import WebhookDelivery
        
        pending_retries = WebhookDelivery.objects.filter(
            status='retrying',
            next_retry_at__lte=timezone.now()
        ).select_related('partner')
        
        count = 0
        for delivery in pending_retries:
            # Actualizar metadata con intento
            delivery.payload['metadata']['delivery_attempt'] = delivery.attempts + 1
            self._send_webhook(delivery.partner, delivery.payload, delivery)
            count += 1
        
        if count > 0:
            logger.info(f"🔄 Reintentadas {count} entregas fallidas")
        
        return count
    
    def verify_incoming_signature(
        self, 
        payload: bytes,
        signature: str,
        partner_code: str
    ) -> bool:
        """
        Verifica la firma de un webhook entrante.
        
        Args:
            payload: Body del request en bytes
            signature: Valor del header X-Signature
            partner_code: Código del partner
            
        Returns:
            True si la firma es válida
        """
        from ..models import Partner
        
        try:
            partner = Partner.objects.get(code=partner_code, status='active')
        except Partner.DoesNotExist:
            logger.warning(f"Partner no encontrado: {partner_code}")
            return False
        
        expected = hmac.new(
            partner.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Soportar formato "sha256=xxx" o solo "xxx"
        if signature.startswith('sha256='):
            return hmac.compare_digest(f"sha256={expected}", signature)
        return hmac.compare_digest(expected, signature)
    
    def log_incoming_event(
        self,
        partner_code: str,
        event_type: str,
        payload: Dict[str, Any],
        headers: Dict[str, str],
        signature_valid: bool
    ):
        """
        Registra un evento webhook entrante.
        
        Args:
            partner_code: Código del partner emisor
            event_type: Tipo de evento
            payload: Datos del evento
            headers: Headers HTTP recibidos
            signature_valid: Si la firma fue válida
        """
        from ..models import Partner, WebhookEventLog
        
        try:
            partner = Partner.objects.get(code=partner_code)
        except Partner.DoesNotExist:
            partner = None
        
        WebhookEventLog.objects.create(
            partner=partner,
            direction='incoming',
            event_type=event_type,
            payload=payload,
            headers=headers,
            signature=headers.get('X-Signature', ''),
            signature_valid=signature_valid,
        )


# Instancia singleton del dispatcher
webhook_dispatcher = WebhookDispatcher()
