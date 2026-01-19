"""
Partner Notifier - Envío de webhooks a partners externos
=========================================================
Pilar 2: Webhooks e Interoperabilidad B2B

Este módulo permite a FindyourWork enviar webhooks firmados 
a partners externos como Chuwue Grill.
"""
import json
import hashlib
import hmac
import logging
import requests
from datetime import datetime
from typing import Dict, Any, Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def sign_payload(payload: Dict[str, Any], secret: str) -> str:
    """
    Firma un payload con HMAC-SHA256.
    
    Args:
        payload: Diccionario a firmar
        secret: Secret compartido
        
    Returns:
        Firma hexadecimal
    """
    payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    return hmac.new(
        secret.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


class PartnerNotifier:
    """
    Clase para enviar webhooks a partners externos.
    Maneja la firma HMAC y el envío HTTP.
    """
    
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
    
    def send_webhook(
        self,
        webhook_url: str,
        event_type: str,
        data: Dict[str, Any],
        shared_secret: str,
        partner_id: str = "findyourwork"
    ) -> bool:
        """
        Envía un webhook firmado a un partner.
        
        Args:
            webhook_url: URL del webhook del partner
            event_type: Tipo de evento (ej: "service.booked_for_event")
            data: Datos del evento
            shared_secret: Secret compartido para HMAC
            partner_id: ID de este sistema como partner
            
        Returns:
            True si el envío fue exitoso (2xx)
        """
        # Construir payload
        payload = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "findyourwork",
            "version": "1.0",
            "data": data
        }
        
        # Firmar payload
        signature = sign_payload(payload, shared_secret)
        
        # Headers con firma HMAC
        headers = {
            "Content-Type": "application/json",
            "X-HMAC-Signature": signature,
            "X-Partner-Signature": signature,  # Compatibilidad con Chuwue Grill
            "X-Partner-ID": partner_id,
            "X-Webhook-Source": "findyourwork"
        }
        
        try:
            logger.info(f"📤 Enviando webhook {event_type} a {webhook_url}")
            
            response = requests.post(
                webhook_url,
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code < 400:
                logger.info(f"✅ Webhook enviado exitosamente: {response.status_code}")
                return True
            else:
                logger.warning(f"⚠️ Webhook rechazado: {response.status_code} - {response.text}")
                return False
                
        except requests.Timeout:
            logger.error(f"❌ Timeout enviando webhook a {webhook_url}")
            return False
        except requests.RequestException as e:
            logger.error(f"❌ Error enviando webhook: {e}")
            return False
    
    def notify_chuwue_grill(
        self,
        event_type: str,
        data: Dict[str, Any],
        shared_secret: Optional[str] = None,
        webhook_url: Optional[str] = None
    ) -> bool:
        """
        Envía webhook específicamente a Chuwue Grill.
        
        Args:
            event_type: Tipo de evento
            data: Datos del evento
            shared_secret: Secret compartido (usa config si no se proporciona)
            webhook_url: URL del webhook (usa config si no se proporciona)
        """
        # Usar configuración por defecto si no se proporciona
        secret = shared_secret or getattr(settings, 'CHUWUE_GRILL_WEBHOOK_SECRET', 'test_secret_chuwue')
        url = webhook_url or getattr(settings, 'CHUWUE_GRILL_WEBHOOK_URL', 'http://localhost:8002/webhooks/partner/findyourwork')
        
        return self.send_webhook(
            webhook_url=url,
            event_type=event_type,
            data=data,
            shared_secret=secret,
            partner_id="findyourwork"
        )


# Funciones de conveniencia para eventos específicos

def notify_service_booked(
    external_event_id: str,
    service_id: int,
    service_name: str,
    service_category: str,
    provider_info: Dict[str, Any],
    price: float,
    scheduled_time: str,
    duration_hours: int = 4
) -> bool:
    """
    Notifica a Chuwue Grill que un servicio fue contratado para su evento.
    
    Ejemplo:
        notify_service_booked(
            external_event_id="RES-2026-001",
            service_id=123,
            service_name="DJ Profesional",
            service_category="entretenimiento",
            provider_info={"id": 456, "name": "DJ Sounds Pro", "phone": "0998765432"},
            price=250.00,
            scheduled_time="19:00"
        )
    """
    notifier = PartnerNotifier()
    
    data = {
        "external_event_id": external_event_id,
        "service_id": service_id,
        "service_name": service_name,
        "service_category": service_category,
        "provider": provider_info,
        "price": price,
        "currency": "USD",
        "scheduled_time": scheduled_time,
        "duration_hours": duration_hours,
        "status": "booked"
    }
    
    return notifier.notify_chuwue_grill(
        event_type="service.booked_for_event",
        data=data
    )


def notify_service_confirmed(
    external_event_id: str,
    service_id: int,
    confirmation_code: str
) -> bool:
    """
    Notifica que un servicio fue confirmado (pago procesado).
    """
    notifier = PartnerNotifier()
    
    data = {
        "external_event_id": external_event_id,
        "service_id": service_id,
        "confirmation_code": confirmation_code,
        "status": "confirmed"
    }
    
    return notifier.notify_chuwue_grill(
        event_type="service.confirmed",
        data=data
    )


def notify_service_cancelled(
    external_event_id: str,
    service_id: int,
    reason: str
) -> bool:
    """
    Notifica que un servicio fue cancelado.
    """
    notifier = PartnerNotifier()
    
    data = {
        "external_event_id": external_event_id,
        "service_id": service_id,
        "reason": reason,
        "status": "cancelled"
    }
    
    return notifier.notify_chuwue_grill(
        event_type="service.cancelled",
        data=data
    )


def notify_provider_assigned(
    external_event_id: str,
    service_id: int,
    provider_info: Dict[str, Any]
) -> bool:
    """
    Notifica que un proveedor fue asignado al servicio.
    """
    notifier = PartnerNotifier()
    
    data = {
        "external_event_id": external_event_id,
        "service_id": service_id,
        "provider": provider_info,
        "status": "provider_assigned"
    }
    
    return notifier.notify_chuwue_grill(
        event_type="provider.assigned",
        data=data
    )
