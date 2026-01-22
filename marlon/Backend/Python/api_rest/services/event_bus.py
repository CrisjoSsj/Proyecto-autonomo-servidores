"""
Event Bus Service - Centraliza todos los eventos externos via n8n
============================================================
Pilar 4: n8n - Event Bus (15%)
Principio fundamental: "Todo evento externo pasa por n8n"

Este servicio proporciona una interfaz unificada para:
1. Payment Handler: Webhooks de pasarelas de pago
2. Partner Handler: Webhooks del grupo partner
3. MCP Input Handler: Mensajes de Telegram/Email/WhatsApp
4. Scheduled Tasks: Tareas programadas
"""
import requests
import json
import hashlib
import hmac
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from django.conf import settings

logger = logging.getLogger(__name__)


class EventBusService:
    """
    Servicio para enviar eventos al Event Bus (n8n).
    Todos los eventos externos del sistema pasan por aquí.
    
    Uso:
        from api_rest.services.event_bus import event_bus
        
        # Emitir evento de pago
        event_bus.emit_payment_received(payment_data)
        
        # Emitir mensaje MCP
        event_bus.emit_mcp_message('telegram', 'Hola', 'user123')
    """
    
    def __init__(self):
        self.n8n_base_url = getattr(settings, 'N8N_WEBHOOK_URL', 'http://localhost:5678')
        self.timeout = getattr(settings, 'N8N_TIMEOUT', 10)
        self.partner_secret = getattr(settings, 'PARTNER_WEBHOOK_SECRET', '')
        self.enabled = getattr(settings, 'EVENT_BUS_ENABLED', True)
    
    def _get_timestamp(self) -> str:
        """Retorna timestamp ISO 8601 con zona horaria UTC"""
        return datetime.utcnow().isoformat() + 'Z'
    
    def _sign_payload(self, payload: Dict[str, Any], secret: str) -> str:
        """Genera firma HMAC-SHA256 para el payload"""
        payload_str = json.dumps(payload, sort_keys=True, default=str)
        signature = hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _send_to_n8n(
        self, 
        webhook_path: str, 
        payload: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
        async_mode: bool = False
    ) -> bool:
        """
        Envía evento al webhook de n8n.
        
        Args:
            webhook_path: Ruta del webhook (sin /webhook/)
            payload: Datos a enviar
            headers: Headers adicionales
            async_mode: Si True, no espera respuesta
            
        Returns:
            bool: True si se envió correctamente
        """
        if not self.enabled:
            logger.debug(f"Event Bus deshabilitado. Evento ignorado: {webhook_path}")
            return True
            
        try:
            url = f"{self.n8n_base_url}/webhook/{webhook_path}"
            
            default_headers = {
                'Content-Type': 'application/json',
                'X-Event-Timestamp': self._get_timestamp(),
                'X-Event-Source': 'findyourwork-django',
                'X-Event-ID': f"{webhook_path}-{datetime.utcnow().timestamp()}"
            }
            
            if headers:
                default_headers.update(headers)
            
            timeout = 1 if async_mode else self.timeout
            
            response = requests.post(
                url,
                json=payload,
                headers=default_headers,
                timeout=timeout
            )
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"✅ Evento enviado a n8n: {webhook_path}")
                return True
            elif response.status_code == 404:
                # Webhook no existe en n8n (workflow no activo o no existe)
                # Pero el evento se envió, así que retornamos True para que Django continúe
                logger.warning(f"⚠️ Webhook {webhook_path} no encontrado en n8n (status 404) - El workflow podría no estar activo")
                return True
            else:
                logger.warning(
                    f"⚠️ n8n respondió con status {response.status_code}: {response.text[:200]}"
                )
                return False
                
        except requests.exceptions.Timeout:
            if async_mode:
                logger.debug(f"Evento enviado en modo async: {webhook_path}")
                return True
            logger.warning(f"⏱️ Timeout enviando evento a n8n (retornando True): {webhook_path}")
            # Retornar True para no bloquear la cadena, pero loguear el error
            return True
        except requests.exceptions.ConnectionError:
            logger.warning(f"⚠️ No se puede conectar a n8n en {self.n8n_base_url} - Continuando sin Event Bus")
            # Retornar True para que Django siga funcionando sin n8n
            return True
        except Exception as e:
            logger.exception(f"⚠️ Error enviando evento a n8n: {e} - Continuando sin Event Bus")
            # Retornar True para que Django siga funcionando incluso si falla n8n
            return True
    
    # ========================================
    # WORKFLOW 1: Payment Handler
    # ========================================
    
    def emit_payment_received(self, payment_data: Dict[str, Any]) -> bool:
        """
        Emite evento de pago recibido desde pasarela externa.
        
        n8n workflow se encarga de:
        - Validar payload
        - Activar servicio/reserva
        - Notificar via WebSocket
        - Enviar email de confirmación
        - Disparar webhook al grupo partner
        
        Args:
            payment_data: Datos del pago incluyendo:
                - id: ID del pago
                - transaction_id: ID de la transacción externa
                - amount: Monto
                - currency: Moneda (default: COP)
                - status: Estado del pago
                - reserva_id: ID de la reserva asociada
                - cliente_id: ID del cliente
                - proveedor_id: ID del proveedor
                - method: Método de pago
        """
        payload = {
            'event_type': 'payment.received',
            'timestamp': self._get_timestamp(),
            'source': 'payment_gateway',
            'data': {
                'payment_id': payment_data.get('id'),
                'transaction_id': payment_data.get('transaction_id'),
                'amount': str(payment_data.get('amount', 0)),
                'currency': payment_data.get('currency', 'COP'),
                'status': payment_data.get('status'),
                'reserva_id': payment_data.get('reserva_id'),
                'cliente_id': payment_data.get('cliente_id'),
                'proveedor_id': payment_data.get('proveedor_id'),
                'payment_method': payment_data.get('method'),
                'metadata': payment_data.get('metadata', {})
            }
        }
        
        return self._send_to_n8n('payment-handler', payload)
    
    def emit_payment_confirmed(self, payment_data: Dict[str, Any]) -> bool:
        """Emite evento cuando el pago es confirmado internamente"""
        payload = {
            'event_type': 'payment.confirmed',
            'timestamp': self._get_timestamp(),
            'data': payment_data
        }
        return self._send_to_n8n('payment-confirmed', payload)
    
    def emit_payment_failed(self, payment_data: Dict[str, Any], reason: str) -> bool:
        """Emite evento cuando el pago falla"""
        payload = {
            'event_type': 'payment.failed',
            'timestamp': self._get_timestamp(),
            'data': payment_data,
            'error': {'reason': reason}
        }
        return self._send_to_n8n('payment-failed', payload)
    
    def emit_payment_refunded(self, payment_data: Dict[str, Any]) -> bool:
        """Emite evento cuando se procesa un reembolso"""
        payload = {
            'event_type': 'payment.refunded',
            'timestamp': self._get_timestamp(),
            'data': payment_data
        }
        return self._send_to_n8n('payment-refunded', payload)
    
    # ========================================
    # WORKFLOW 2: Partner Handler
    # ========================================
    
    def emit_to_partner(
        self, 
        event_type: str, 
        data: Dict[str, Any],
        partner_id: Optional[str] = None
    ) -> bool:
        """
        Envía evento al grupo partner con firma HMAC.
        n8n se encarga de enviar al partner y manejar la respuesta.
        
        Args:
            event_type: Tipo de evento (ej: 'reservation.created')
            data: Datos del evento
            partner_id: ID del partner específico (opcional)
        """
        payload = {
            'event_type': event_type,
            'timestamp': self._get_timestamp(),
            'partner_id': partner_id,
            'data': data
        }
        
        # Firmar payload
        signature = self._sign_payload(payload, self.partner_secret)
        headers = {
            'X-Partner-Signature': f"sha256={signature}",
            'X-Event-Type': event_type
        }
        
        return self._send_to_n8n('partner-outbound', payload, headers)
    
    def verify_partner_signature(self, payload: Dict[str, Any], signature: str) -> bool:
        """
        Verifica la firma HMAC de un webhook del partner.
        
        Args:
            payload: Payload recibido
            signature: Firma del header X-Partner-Signature
            
        Returns:
            bool: True si la firma es válida
        """
        expected_signature = self._sign_payload(payload, self.partner_secret)
        expected = f"sha256={expected_signature}"
        return hmac.compare_digest(signature, expected)
    
    # ========================================
    # WORKFLOW 3: MCP Input Handler
    # ========================================
    
    def emit_mcp_message(
        self, 
        channel: str, 
        message: str, 
        sender_id: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Emite mensaje recibido de canal externo (Telegram, Email, WhatsApp).
        n8n lo procesa y envía al AI Orchestrator.
        
        Args:
            channel: Canal de origen ('telegram', 'email', 'whatsapp')
            message: Contenido del mensaje
            sender_id: ID del remitente en el canal
            attachments: Lista de adjuntos con {type, file_id/url, filename}
            metadata: Datos adicionales del mensaje
        """
        payload = {
            'event_type': 'mcp.message_received',
            'timestamp': self._get_timestamp(),
            'channel': channel,
            'data': {
                'sender_id': sender_id,
                'message': message,
                'attachments': attachments or [],
                'metadata': metadata or {}
            }
        }
        
        return self._send_to_n8n('mcp-input', payload)
    
    def emit_mcp_response(
        self, 
        channel: str, 
        recipient_id: str, 
        response: str,
        original_message_id: Optional[str] = None,
        response_type: str = 'text'
    ) -> bool:
        """
        Emite respuesta para enviar por el canal correspondiente.
        
        Args:
            channel: Canal de destino
            recipient_id: ID del destinatario
            response: Contenido de la respuesta
            original_message_id: ID del mensaje original (para reply)
            response_type: Tipo de respuesta ('text', 'image', 'document')
        """
        payload = {
            'event_type': 'mcp.response_ready',
            'timestamp': self._get_timestamp(),
            'channel': channel,
            'data': {
                'recipient_id': recipient_id,
                'response': response,
                'response_type': response_type,
                'original_message_id': original_message_id
            }
        }
        
        return self._send_to_n8n('mcp-output', payload)
    
    # ========================================
    # WORKFLOW 4: Scheduled Tasks
    # ========================================
    
    def trigger_scheduled_task(
        self, 
        task_name: str, 
        params: Optional[Dict[str, Any]] = None,
        priority: str = 'normal'
    ) -> bool:
        """
        Dispara una tarea programada manualmente.
        Útil para testing o ejecución forzada.
        
        Args:
            task_name: Nombre de la tarea
            params: Parámetros de la tarea
            priority: Prioridad ('low', 'normal', 'high')
        """
        payload = {
            'event_type': 'scheduled.manual_trigger',
            'timestamp': self._get_timestamp(),
            'task': task_name,
            'priority': priority,
            'params': params or {}
        }
        
        return self._send_to_n8n('scheduled-tasks', payload)
    
    def emit_health_check_result(
        self, 
        service_name: str, 
        status: str, 
        details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Emite resultado de health check.
        
        Args:
            service_name: Nombre del servicio
            status: Estado ('healthy', 'degraded', 'unhealthy')
            details: Detalles adicionales
        """
        payload = {
            'event_type': 'health.check_result',
            'timestamp': self._get_timestamp(),
            'service': service_name,
            'status': status,
            'details': details or {}
        }
        
        return self._send_to_n8n('health-monitor', payload)
    
    # ========================================
    # Eventos de Negocio Generales
    # ========================================
    
    def emit_reserva_created(self, reserva_data: Dict[str, Any]) -> bool:
        """Emite evento de reserva creada para procesamiento externo"""
        payload = {
            'event_type': 'reserva.created',
            'timestamp': self._get_timestamp(),
            'data': reserva_data
        }
        return self._send_to_n8n('business-events', payload, async_mode=True)
    
    def emit_reserva_updated(self, reserva_data: Dict[str, Any]) -> bool:
        """Emite evento de reserva actualizada"""
        payload = {
            'event_type': 'reserva.updated',
            'timestamp': self._get_timestamp(),
            'data': reserva_data
        }
        return self._send_to_n8n('business-events', payload, async_mode=True)
    
    def emit_reserva_cancelled(self, reserva_data: Dict[str, Any]) -> bool:
        """Emite evento de reserva cancelada"""
        payload = {
            'event_type': 'reserva.cancelled',
            'timestamp': self._get_timestamp(),
            'data': reserva_data
        }
        return self._send_to_n8n('business-events', payload)
    
    def emit_servicio_created(self, servicio_data: Dict[str, Any]) -> bool:
        """Emite evento de servicio creado"""
        payload = {
            'event_type': 'servicio.created',
            'timestamp': self._get_timestamp(),
            'data': servicio_data
        }
        return self._send_to_n8n('business-events', payload, async_mode=True)
    
    def emit_servicio_updated(self, servicio_data: Dict[str, Any]) -> bool:
        """Emite evento de servicio actualizado"""
        payload = {
            'event_type': 'servicio.updated',
            'timestamp': self._get_timestamp(),
            'data': servicio_data
        }
        return self._send_to_n8n('business-events', payload, async_mode=True)
    
    def emit_user_registered(self, user_data: Dict[str, Any]) -> bool:
        """Emite evento de usuario registrado"""
        payload = {
            'event_type': 'user.registered',
            'timestamp': self._get_timestamp(),
            'data': user_data
        }
        return self._send_to_n8n('business-events', payload)
    
    def emit_review_created(self, review_data: Dict[str, Any]) -> bool:
        """Emite evento de reseña/calificación creada"""
        payload = {
            'event_type': 'review.created',
            'timestamp': self._get_timestamp(),
            'data': review_data
        }
        return self._send_to_n8n('business-events', payload, async_mode=True)
    
    # ========================================
    # Notificaciones
    # ========================================
    
    def send_notification(
        self,
        notification_type: str,
        recipients: List[str],
        title: str,
        message: str,
        channels: Optional[List[str]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Envía notificación multicanal via n8n.
        
        Args:
            notification_type: Tipo de notificación
            recipients: Lista de IDs de destinatarios
            title: Título de la notificación
            message: Mensaje
            channels: Canales a usar (['email', 'push', 'websocket'])
            data: Datos adicionales
        """
        payload = {
            'event_type': 'notification.send',
            'timestamp': self._get_timestamp(),
            'notification_type': notification_type,
            'recipients': recipients,
            'title': title,
            'message': message,
            'channels': channels or ['websocket'],
            'data': data or {}
        }
        
        return self._send_to_n8n('notifications', payload)


# Singleton instance
event_bus = EventBusService()
