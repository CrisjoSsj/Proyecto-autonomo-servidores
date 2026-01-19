"""
Partner Notifier - Envía webhooks a partners B2B
================================================

Módulo para notificar eventos a partners externos como FindyourWork.
Implementa firma HMAC-SHA256 para autenticación.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx

from .hmac_signer import sign_payload

logger = logging.getLogger(__name__)


class PartnerNotifier:
    """
    Servicio para enviar webhooks firmados a partners B2B
    """
    
    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout
    
    async def send_webhook(
        self,
        webhook_url: str,
        event_type: str,
        data: Dict[str, Any],
        shared_secret: str,
        partner_id: str = "chuwue-grill"
    ) -> bool:
        """
        Envía un webhook firmado a un partner
        
        Args:
            webhook_url: URL del endpoint del partner
            event_type: Tipo de evento (ej: "event.reservation_confirmed")
            data: Datos del evento
            shared_secret: Secret compartido para firma HMAC
            partner_id: ID de nuestro sistema como partner
            
        Returns:
            True si el webhook fue recibido exitosamente
        """
        payload = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "chuwue-grill",
            "version": "1.0",
            "data": data
        }
        
        # Firmar payload
        signature = sign_payload(payload, shared_secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-HMAC-Signature": signature,
            "X-Partner-Signature": signature,  # Compatibilidad con FindyourWork
            "X-Partner-ID": partner_id,
            "X-Webhook-Source": "chuwue-grill"
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers=headers
                )
            
            success = response.status_code < 400
            
            if success:
                logger.info(f"✅ Webhook enviado a {webhook_url}: {event_type}")
            else:
                logger.warning(f"⚠️ Webhook falló ({response.status_code}): {response.text[:200]}")
            
            return success
            
        except httpx.TimeoutException:
            logger.error(f"❌ Timeout enviando webhook a {webhook_url}")
            return False
        except Exception as e:
            logger.error(f"❌ Error enviando webhook: {e}")
            return False
    
    async def notify_findyourwork(
        self,
        event_type: str,
        data: Dict[str, Any],
        shared_secret: str,
        webhook_url: str = "http://localhost:8000/webhooks/partner/"
    ) -> bool:
        """
        Envía un webhook específico a FindyourWork
        
        Eventos soportados:
        - event.reservation_confirmed: Reserva de evento corporativo confirmada
        - event.updated: Evento actualizado (fecha, hora, asistentes)
        - event.cancelled: Evento cancelado
        - payment.success: Pago del evento procesado
        """
        return await self.send_webhook(
            webhook_url=webhook_url,
            event_type=event_type,
            data=data,
            shared_secret=shared_secret,
            partner_id="chuwue-grill"
        )


# ============================================
# Funciones de conveniencia
# ============================================

async def notify_event_reservation(
    reservation_data: Dict[str, Any],
    shared_secret: str,
    webhook_url: str = "http://localhost:8000/webhooks/partner/"
) -> bool:
    """
    Notifica a FindyourWork sobre una reserva de evento corporativo
    
    Args:
        reservation_data: Datos de la reserva:
            - reservation_id: ID de la reserva
            - event_name: Nombre del evento
            - date: Fecha (YYYY-MM-DD)
            - time: Hora (HH:MM)
            - guests: Número de invitados
            - contact_name: Nombre del contacto
            - contact_phone: Teléfono
            - contact_email: Email
            - services_requested: Lista de servicios solicitados ["dj", "decoracion", "fotografia"]
            - notes: Notas adicionales
    """
    notifier = PartnerNotifier()
    return await notifier.notify_findyourwork(
        event_type="event.reservation_confirmed",
        data=reservation_data,
        shared_secret=shared_secret,
        webhook_url=webhook_url
    )


async def notify_event_updated(
    reservation_id: str,
    updates: Dict[str, Any],
    shared_secret: str,
    webhook_url: str = "http://localhost:8000/webhooks/partner/"
) -> bool:
    """
    Notifica a FindyourWork sobre actualización de un evento
    
    Args:
        reservation_id: ID de la reserva
        updates: Campos actualizados
    """
    notifier = PartnerNotifier()
    return await notifier.notify_findyourwork(
        event_type="event.updated",
        data={
            "reservation_id": reservation_id,
            "updates": updates
        },
        shared_secret=shared_secret,
        webhook_url=webhook_url
    )


async def notify_event_cancelled(
    reservation_id: str,
    reason: str,
    shared_secret: str,
    webhook_url: str = "http://localhost:8000/webhooks/partner/"
) -> bool:
    """
    Notifica a FindyourWork sobre cancelación de un evento
    """
    notifier = PartnerNotifier()
    return await notifier.notify_findyourwork(
        event_type="event.cancelled",
        data={
            "reservation_id": reservation_id,
            "reason": reason
        },
        shared_secret=shared_secret,
        webhook_url=webhook_url
    )


async def notify_payment_success(
    reservation_id: str,
    payment_data: Dict[str, Any],
    shared_secret: str,
    webhook_url: str = "http://localhost:8000/webhooks/partner/"
) -> bool:
    """
    Notifica a FindyourWork sobre pago exitoso de un evento
    """
    notifier = PartnerNotifier()
    return await notifier.notify_findyourwork(
        event_type="payment.success",
        data={
            "reservation_id": reservation_id,
            **payment_data
        },
        shared_secret=shared_secret,
        webhook_url=webhook_url
    )


# ============================================
# Ejemplo de uso
# ============================================

"""
# Ejemplo: Notificar reserva de evento corporativo

from utils.partner_notifier import notify_event_reservation

# Cuando se confirma una reserva de evento grande
reservation = {
    "reservation_id": "RES-2026-001",
    "event_name": "Cena Corporativa TechCorp",
    "date": "2026-02-15",
    "time": "19:00",
    "guests": 50,
    "contact_name": "María García",
    "contact_phone": "0991234567",
    "contact_email": "maria@techcorp.com",
    "budget_range": "1000-2000",
    "services_requested": ["dj", "decoracion", "fotografia"],
    "notes": "Celebración de aniversario de la empresa"
}

# Obtener el secret del partner FindyourWork desde la BD
partner = db.query(Partner).filter(Partner.partner_name == "FindyourWork").first()

success = await notify_event_reservation(
    reservation_data=reservation,
    shared_secret=partner.shared_secret,
    webhook_url=partner.webhook_url
)

if success:
    print("FindyourWork notificado exitosamente")
"""
