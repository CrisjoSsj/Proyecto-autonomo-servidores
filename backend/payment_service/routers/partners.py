"""
Router de Partners
Registro y gestión de webhooks B2B
"""
import uuid
import json
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import httpx

from database import get_db
from models.partner import Partner
from utils.hmac_signer import sign_payload

router = APIRouter(prefix="/partners", tags=["Partners B2B"])


# ============================================
# Schemas
# ============================================

class PartnerRegisterRequest(BaseModel):
    """Solicitud de registro de partner"""
    partner_name: str
    webhook_url: str
    events: List[str]  # ["reservation.confirmed", "payment.success"]
    contact_email: Optional[str] = None


class PartnerResponse(BaseModel):
    """Respuesta de registro de partner"""
    partner_id: str
    partner_name: str
    webhook_url: str
    subscribed_events: List[str]
    shared_secret: str  # Solo se muestra una vez
    status: str
    created_at: str


class PartnerInfoResponse(BaseModel):
    """Info de partner (sin secret)"""
    partner_id: str
    partner_name: str
    webhook_url: str
    subscribed_events: List[str]
    is_active: bool
    webhook_success_count: int
    webhook_failure_count: int
    last_webhook_at: Optional[str]
    created_at: str


class SendWebhookRequest(BaseModel):
    """Solicitud para enviar webhook a partner"""
    event_type: str
    data: dict


# ============================================
# Endpoints
# ============================================

@router.post("/register", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
async def register_partner(
    request: PartnerRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registrar un nuevo partner para webhooks
    
    - **partner_name**: Nombre del partner (ej: "Grupo-Tours")
    - **webhook_url**: URL donde recibirán los webhooks
    - **events**: Lista de eventos a los que se suscriben
    - **contact_email**: Email de contacto (opcional)
    
    Returns:
        partner_id y shared_secret para firmar webhooks
        
    **IMPORTANTE**: El shared_secret solo se muestra una vez.
    Guárdalo de forma segura.
    """
    # Generar IDs y secret
    partner_id = f"partner_{uuid.uuid4().hex[:12]}"
    shared_secret = f"whsec_{secrets.token_urlsafe(32)}"
    
    # Crear partner
    partner = Partner(
        partner_id=partner_id,
        partner_name=request.partner_name,
        webhook_url=request.webhook_url,
        shared_secret=shared_secret,
        subscribed_events=json.dumps(request.events),
        contact_email=request.contact_email,
        is_active=True
    )
    
    db.add(partner)
    db.commit()
    db.refresh(partner)
    
    return PartnerResponse(
        partner_id=partner.partner_id,
        partner_name=partner.partner_name,
        webhook_url=partner.webhook_url,
        subscribed_events=request.events,
        shared_secret=shared_secret,
        status="active",
        created_at=partner.created_at.isoformat()
    )


@router.get("/{partner_id}", response_model=PartnerInfoResponse)
async def get_partner(partner_id: str, db: Session = Depends(get_db)):
    """Obtener información de un partner"""
    
    partner = db.query(Partner).filter(Partner.partner_id == partner_id).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner no encontrado"
        )
    
    return PartnerInfoResponse(
        partner_id=partner.partner_id,
        partner_name=partner.partner_name,
        webhook_url=partner.webhook_url,
        subscribed_events=json.loads(partner.subscribed_events),
        is_active=partner.is_active,
        webhook_success_count=partner.webhook_success_count,
        webhook_failure_count=partner.webhook_failure_count,
        last_webhook_at=partner.last_webhook_at.isoformat() if partner.last_webhook_at else None,
        created_at=partner.created_at.isoformat()
    )


@router.get("/", response_model=List[PartnerInfoResponse])
async def list_partners(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Listar todos los partners"""
    
    query = db.query(Partner)
    if active_only:
        query = query.filter(Partner.is_active == True)
    
    partners = query.all()
    
    return [
        PartnerInfoResponse(
            partner_id=p.partner_id,
            partner_name=p.partner_name,
            webhook_url=p.webhook_url,
            subscribed_events=json.loads(p.subscribed_events),
            is_active=p.is_active,
            webhook_success_count=p.webhook_success_count,
            webhook_failure_count=p.webhook_failure_count,
            last_webhook_at=p.last_webhook_at.isoformat() if p.last_webhook_at else None,
            created_at=p.created_at.isoformat()
        )
        for p in partners
    ]


@router.post("/{partner_id}/send-webhook")
async def send_webhook_to_partner(
    partner_id: str,
    request: SendWebhookRequest,
    db: Session = Depends(get_db)
):
    """
    Enviar un webhook a un partner
    
    Útil para pruebas y para disparar eventos manualmente.
    
    - **event_type**: Tipo de evento
    - **data**: Datos del evento
    """
    partner = db.query(Partner).filter(
        Partner.partner_id == partner_id,
        Partner.is_active == True
    ).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner no encontrado"
        )
    
    # Crear payload
    payload = {
        "event_type": request.event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": request.data
    }
    
    # Firmar
    signature = sign_payload(payload, partner.shared_secret)
    
    # Enviar webhook
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                partner.webhook_url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-HMAC-Signature": signature,
                    "X-Webhook-Source": "chuwue-grill"
                }
            )
        
        success = response.status_code < 400
        
        # Actualizar estadísticas
        if success:
            partner.webhook_success_count += 1
        else:
            partner.webhook_failure_count += 1
        partner.last_webhook_at = datetime.now(timezone.utc)
        db.commit()
        
        return {
            "success": success,
            "status_code": response.status_code,
            "response": response.text[:500] if response.text else None
        }
        
    except Exception as e:
        partner.webhook_failure_count += 1
        db.commit()
        
        return {
            "success": False,
            "error": str(e)
        }


@router.delete("/{partner_id}")
async def deactivate_partner(partner_id: str, db: Session = Depends(get_db)):
    """Desactivar un partner"""
    
    partner = db.query(Partner).filter(Partner.partner_id == partner_id).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner no encontrado"
        )
    
    partner.is_active = False
    db.commit()
    
    return {"message": "Partner desactivado", "partner_id": partner_id}


# ============================================
# Integración con FindyourWork
# ============================================

class FindyourWorkRegisterRequest(BaseModel):
    """Solicitud de registro rápido de FindyourWork"""
    webhook_url: str = "http://localhost:8000/webhooks/partner/"
    contact_email: Optional[str] = "dev@findyourwork.com"


@router.post("/register/findyourwork", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
async def register_findyourwork(
    request: FindyourWorkRegisterRequest = FindyourWorkRegisterRequest(),
    db: Session = Depends(get_db)
):
    """
    Registro rápido de FindyourWork como partner
    
    Crea el partner con eventos pre-configurados para la integración B2B.
    
    Eventos suscritos:
    - event.reservation_confirmed
    - event.updated
    - event.cancelled
    - payment.success
    """
    # Verificar si ya existe
    existing = db.query(Partner).filter(
        Partner.partner_name == "FindyourWork"
    ).first()
    
    if existing:
        # Retornar el existente (sin mostrar el secret)
        return PartnerResponse(
            partner_id=existing.partner_id,
            partner_name=existing.partner_name,
            webhook_url=existing.webhook_url,
            subscribed_events=json.loads(existing.subscribed_events),
            shared_secret="[OCULTO - Ya registrado previamente]",
            status="active" if existing.is_active else "inactive",
            created_at=existing.created_at.isoformat()
        )
    
    # Eventos pre-configurados para FindyourWork
    events = [
        "event.reservation_confirmed",
        "event.updated", 
        "event.cancelled",
        "payment.success"
    ]
    
    # Generar IDs y secret
    partner_id = "partner_findyourwork"
    shared_secret = f"whsec_{secrets.token_urlsafe(32)}"
    
    # Crear partner
    partner = Partner(
        partner_id=partner_id,
        partner_name="FindyourWork",
        webhook_url=request.webhook_url,
        shared_secret=shared_secret,
        subscribed_events=json.dumps(events),
        contact_email=request.contact_email,
        is_active=True
    )
    
    db.add(partner)
    db.commit()
    db.refresh(partner)
    
    return PartnerResponse(
        partner_id=partner.partner_id,
        partner_name=partner.partner_name,
        webhook_url=partner.webhook_url,
        subscribed_events=events,
        shared_secret=shared_secret,
        status="active",
        created_at=partner.created_at.isoformat()
    )


class EventReservationRequest(BaseModel):
    """Solicitud para notificar reserva de evento"""
    reservation_id: str
    event_name: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    guests: int
    contact_name: str
    contact_phone: str
    contact_email: Optional[str] = None
    budget_range: Optional[str] = None
    services_requested: List[str] = []  # ["dj", "decoracion", "fotografia"]
    notes: Optional[str] = None


@router.post("/findyourwork/notify-event")
async def notify_findyourwork_event(
    request: EventReservationRequest,
    db: Session = Depends(get_db)
):
    """
    Notificar a FindyourWork sobre un evento corporativo
    
    Envía webhook con los datos de la reserva para que FindyourWork
    pueda ofrecer servicios adicionales (DJ, decoración, fotografía, etc.)
    """
    from utils.partner_notifier import PartnerNotifier
    
    # Buscar partner FindyourWork
    partner = db.query(Partner).filter(
        Partner.partner_name == "FindyourWork",
        Partner.is_active == True
    ).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FindyourWork no está registrado como partner. Use POST /partners/register/findyourwork primero."
        )
    
    # Preparar datos del evento
    event_data = {
        "reservation_id": request.reservation_id,
        "event_name": request.event_name,
        "date": request.date,
        "time": request.time,
        "guests": request.guests,
        "contact_name": request.contact_name,
        "contact_phone": request.contact_phone,
        "contact_email": request.contact_email,
        "budget_range": request.budget_range,
        "services_requested": request.services_requested,
        "notes": request.notes,
        "restaurant": {
            "name": "Chuwue Grill",
            "address": "Manta, Ecuador",
            "phone": "0999999999"
        }
    }
    
    # Enviar webhook
    notifier = PartnerNotifier()
    success = await notifier.notify_findyourwork(
        event_type="event.reservation_confirmed",
        data=event_data,
        shared_secret=partner.shared_secret,
        webhook_url=partner.webhook_url
    )
    
    if success:
        partner.webhook_success_count += 1
        partner.last_webhook_at = datetime.now(timezone.utc)
    else:
        partner.webhook_failure_count += 1
    
    db.commit()
    
    return {
        "success": success,
        "message": "Webhook enviado a FindyourWork" if success else "Error enviando webhook",
        "event_type": "event.reservation_confirmed",
        "reservation_id": request.reservation_id,
        "webhook_url": partner.webhook_url
    }


@router.get("/findyourwork/status")
async def findyourwork_status(db: Session = Depends(get_db)):
    """
    Verificar estado de la integración con FindyourWork
    """
    partner = db.query(Partner).filter(
        Partner.partner_name == "FindyourWork"
    ).first()
    
    if not partner:
        return {
            "registered": False,
            "message": "FindyourWork no está registrado. Use POST /partners/register/findyourwork"
        }
    
    return {
        "registered": True,
        "partner_id": partner.partner_id,
        "is_active": partner.is_active,
        "webhook_url": partner.webhook_url,
        "subscribed_events": json.loads(partner.subscribed_events),
        "stats": {
            "webhooks_sent": partner.webhook_success_count,
            "webhooks_failed": partner.webhook_failure_count,
            "last_webhook": partner.last_webhook_at.isoformat() if partner.last_webhook_at else None
        },
        "created_at": partner.created_at.isoformat()
    }


# ============================================
# Integración específica con FindyourWork
# ============================================

class FindyourWorkRegisterRequest(BaseModel):
    """Registro simplificado para FindyourWork"""
    webhook_url: str = "http://localhost:8000/webhooks/partner/"
    contact_email: Optional[str] = "dev@findyourwork.com"


@router.post("/findyourwork/register", status_code=status.HTTP_201_CREATED)
async def register_findyourwork(
    request: FindyourWorkRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registro rápido de FindyourWork como partner
    
    Crea automáticamente la configuración de integración con:
    - Eventos predefinidos para la integración
    - Generación de shared_secret
    """
    # Verificar si ya existe
    existing = db.query(Partner).filter(
        Partner.partner_name == "FindyourWork"
    ).first()
    
    if existing:
        return {
            "message": "FindyourWork ya está registrado",
            "partner_id": existing.partner_id,
            "webhook_url": existing.webhook_url,
            "note": "Usa el shared_secret original o elimina y re-registra"
        }
    
    # Eventos que FindyourWork recibirá de Chuwue Grill
    events = [
        "event.reservation_confirmed",
        "event.updated", 
        "event.cancelled",
        "payment.success"
    ]
    
    # Generar IDs y secret
    partner_id = "partner_findyourwork"
    shared_secret = f"whsec_{secrets.token_urlsafe(32)}"
    
    # Crear partner
    partner = Partner(
        partner_id=partner_id,
        partner_name="FindyourWork",
        webhook_url=request.webhook_url,
        shared_secret=shared_secret,
        subscribed_events=json.dumps(events),
        contact_email=request.contact_email,
        is_active=True
    )
    
    db.add(partner)
    db.commit()
    db.refresh(partner)
    
    return {
        "message": "FindyourWork registrado exitosamente",
        "partner_id": partner.partner_id,
        "partner_name": partner.partner_name,
        "webhook_url": partner.webhook_url,
        "subscribed_events": events,
        "shared_secret": shared_secret,
        "important": "Guarda el shared_secret. Solo se muestra una vez.",
        "integration_docs": "/docs/INTEGRACION_FINDYOURWORK.md"
    }


class EventNotificationRequest(BaseModel):
    """Datos para notificar evento a FindyourWork"""
    reservation_id: str
    event_name: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    guests: int
    contact_name: str
    contact_phone: str
    contact_email: Optional[str] = None
    services_requested: Optional[List[str]] = None  # ["dj", "decoracion", "fotografia"]
    notes: Optional[str] = None


@router.post("/findyourwork/notify-event")
async def notify_findyourwork_event(
    request: EventNotificationRequest,
    db: Session = Depends(get_db)
):
    """
    Notifica a FindyourWork sobre un evento corporativo
    
    Envía un webhook con la información del evento para que
    FindyourWork pueda ofrecer servicios adicionales.
    """
    from utils.partner_notifier import notify_event_reservation
    
    # Obtener partner FindyourWork
    partner = db.query(Partner).filter(
        Partner.partner_name == "FindyourWork",
        Partner.is_active == True
    ).first()
    
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FindyourWork no está registrado. Usa /partners/findyourwork/register primero."
        )
    
    # Preparar datos
    reservation_data = {
        "reservation_id": request.reservation_id,
        "event_name": request.event_name,
        "date": request.date,
        "time": request.time,
        "guests": request.guests,
        "contact_name": request.contact_name,
        "contact_phone": request.contact_phone,
        "contact_email": request.contact_email,
        "services_requested": request.services_requested or [],
        "notes": request.notes,
        "source_restaurant": "Chuwue Grill"
    }
    
    # Enviar webhook
    success = await notify_event_reservation(
        reservation_data=reservation_data,
        shared_secret=partner.shared_secret,
        webhook_url=partner.webhook_url
    )
    
    # Actualizar estadísticas
    if success:
        partner.webhook_success_count += 1
    else:
        partner.webhook_failure_count += 1
    partner.last_webhook_at = datetime.now(timezone.utc)
    db.commit()
    
    return {
        "success": success,
        "event_type": "event.reservation_confirmed",
        "reservation_id": request.reservation_id,
        "sent_to": partner.webhook_url,
        "message": "Webhook enviado a FindyourWork" if success else "Error enviando webhook"
    }


@router.get("/findyourwork/status")
async def findyourwork_status(db: Session = Depends(get_db)):
    """
    Verifica el estado de la integración con FindyourWork
    """
    partner = db.query(Partner).filter(
        Partner.partner_name == "FindyourWork"
    ).first()
    
    if not partner:
        return {
            "registered": False,
            "message": "FindyourWork no está registrado",
            "action": "POST /partners/findyourwork/register para registrar"
        }
    
    return {
        "registered": True,
        "partner_id": partner.partner_id,
        "webhook_url": partner.webhook_url,
        "is_active": partner.is_active,
        "subscribed_events": json.loads(partner.subscribed_events),
        "stats": {
            "webhooks_sent": partner.webhook_success_count,
            "webhooks_failed": partner.webhook_failure_count,
            "last_webhook": partner.last_webhook_at.isoformat() if partner.last_webhook_at else None
        },
        "created_at": partner.created_at.isoformat()
    }
