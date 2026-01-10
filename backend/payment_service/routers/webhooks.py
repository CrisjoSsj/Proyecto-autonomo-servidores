"""
Router de Webhooks
Recibe webhooks de pasarelas de pago y partners
"""
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, status, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.payment import Payment, PaymentStatus
from models.partner import Partner
from adapters import MockAdapter, StripeAdapter
from utils.hmac_signer import verify_signature
from utils.event_normalizer import normalize_event
from config import get_settings

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
settings = get_settings()


# ============================================
# Webhooks de Pasarelas de Pago
# ============================================

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook de Stripe
    
    Recibe eventos de Stripe y actualiza el estado de los pagos.
    """
    payload = await request.body()
    
    adapter = StripeAdapter()
    
    # Verificar firma
    if stripe_signature:
        if not await adapter.verify_webhook(payload, stripe_signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firma de webhook inválida"
            )
    
    # Parsear evento
    event = await adapter.parse_webhook(payload)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo parsear el webhook"
        )
    
    # Actualizar pago en BD
    payment = db.query(Payment).filter(
        Payment.provider_payment_id == event.payment_id
    ).first()
    
    if payment:
        payment.status = event.status.value
        if event.status == PaymentStatus.COMPLETED:
            payment.completed_at = datetime.now(timezone.utc)
        db.commit()
    
    return {"received": True, "event_type": event.event_type}


@router.post("/mock")
async def mock_webhook(
    request: Request,
    x_mock_signature: Optional[str] = Header(None, alias="X-Mock-Signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook de Mock (para pruebas)
    """
    payload = await request.body()
    
    adapter = MockAdapter()
    
    # Verificar firma si existe
    if x_mock_signature:
        if not await adapter.verify_webhook(payload, x_mock_signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firma de webhook inválida"
            )
    
    # Parsear evento
    event = await adapter.parse_webhook(payload)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo parsear el webhook"
        )
    
    # Actualizar pago
    payment = db.query(Payment).filter(
        Payment.payment_id == event.payment_id
    ).first()
    
    if payment:
        payment.status = event.status.value
        if event.status == PaymentStatus.COMPLETED:
            payment.completed_at = datetime.now(timezone.utc)
        db.commit()
    
    return {"received": True, "event_type": event.event_type}


# ============================================
# Webhooks de Partners (B2B)
# ============================================

@router.post("/partner/{partner_id}")
async def partner_webhook(
    partner_id: str,
    request: Request,
    x_hmac_signature: str = Header(..., alias="X-HMAC-Signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook de Partner (otro grupo)
    
    Recibe eventos de sistemas integrados (reservas, tours, etc.)
    Verifica la firma HMAC antes de procesar.
    
    Headers requeridos:
    - X-HMAC-Signature: Firma HMAC-SHA256 del payload
    """
    # Buscar partner
    partner = db.query(Partner).filter(
        Partner.partner_id == partner_id,
        Partner.is_active == True
    ).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "status": 404,
                "error": "NOT_FOUND",
                "message": "Partner no encontrado o inactivo",
                "details": [{"code": "PARTNER_NOT_REGISTERED", "message": f"Partner {partner_id} no existe"}]
            }
        )
    
    # Obtener payload
    payload = await request.body()
    
    # Verificar firma HMAC
    if not verify_signature(payload, x_hmac_signature, partner.shared_secret):
        partner.webhook_failure_count += 1
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Firma HMAC inválida",
                "details": [{"code": "PARTNER_HMAC_INVALID", "message": "La firma no coincide"}]
            }
        )
    
    # Parsear payload
    try:
        event_data = json.loads(payload.decode())
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload JSON inválido"
        )
    
    event_type = event_data.get("event_type", "unknown")
    
    # Verificar que el partner está suscrito a este evento
    subscribed = json.loads(partner.subscribed_events)
    if event_type not in subscribed and "*" not in subscribed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "status": 400,
                "error": "BAD_REQUEST",
                "message": f"Partner no suscrito al evento: {event_type}",
                "details": [{"code": "PARTNER_EVENT_UNKNOWN", "message": "Evento no suscrito"}]
            }
        )
    
    # Procesar evento según tipo
    # TODO: Implementar lógica de negocio según cada evento
    result = await process_partner_event(event_type, event_data, partner, db)
    
    # Actualizar estadísticas del partner
    partner.webhook_success_count += 1
    partner.last_webhook_at = datetime.now(timezone.utc)
    db.commit()
    
    # Responder ACK
    return {
        "status": "ok",
        "message": "Evento procesado",
        "event_type": event_type,
        "result": result
    }


async def process_partner_event(
    event_type: str,
    event_data: dict,
    partner: Partner,
    db: Session
) -> dict:
    """
    Procesa eventos de partners según su tipo
    
    PLACEHOLDER: Aquí se implementará la lógica de negocio
    cuando se integre con el grupo partner real.
    """
    
    # Eventos soportados (placeholder)
    handlers = {
        "reservation.confirmed": lambda d: {"action": "reservation_linked", "id": d.get("reservation_id")},
        "payment.success": lambda d: {"action": "payment_registered", "id": d.get("payment_id")},
        "tour.purchased": lambda d: {"action": "tour_linked", "id": d.get("tour_id")},
        "service.activated": lambda d: {"action": "service_activated", "id": d.get("service_id")},
    }
    
    handler = handlers.get(event_type, lambda d: {"action": "logged", "event": event_type})
    
    result = handler(event_data.get("data", {}))
    
    # TODO: Integrar con Core API para ejecutar acciones reales
    # Por ejemplo: crear reserva relacionada, actualizar estado, etc.
    
    return result
