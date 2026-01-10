"""
Router de Pagos
Endpoints para crear y gestionar pagos
"""
import uuid
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.payment import Payment, PaymentStatus
from adapters import MockAdapter, StripeAdapter, PaymentProvider
from config import get_settings

router = APIRouter(prefix="/payments", tags=["Pagos"])
settings = get_settings()


# ============================================
# Provider Factory
# ============================================

def get_payment_provider() -> PaymentProvider:
    """Factory para obtener el provider configurado"""
    if settings.payment_provider == "stripe" and settings.stripe_secret_key:
        return StripeAdapter()
    return MockAdapter()


# ============================================
# Schemas
# ============================================

class CreatePaymentRequest(BaseModel):
    """Solicitud de creación de pago"""
    amount: float
    currency: str = "USD"
    description: str
    metadata: Optional[dict] = None
    user_id: int  # En producción vendría del token


class PaymentResponse(BaseModel):
    """Respuesta de pago"""
    payment_id: str
    status: str
    amount: float
    currency: str
    provider: str
    provider_payment_id: Optional[str] = None
    message: Optional[str] = None
    redirect_url: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True


# ============================================
# Endpoints
# ============================================

@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    request: CreatePaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo pago
    
    - **amount**: Monto del pago
    - **currency**: Moneda (USD por defecto)
    - **description**: Descripción del pago
    - **metadata**: Datos adicionales
    """
    provider = get_payment_provider()
    
    # Crear pago en el provider
    result = await provider.create_payment(
        amount=request.amount,
        currency=request.currency,
        description=request.description,
        metadata=request.metadata
    )
    
    # Guardar en BD
    payment = Payment(
        payment_id=result.payment_id or f"pay_{uuid.uuid4().hex[:16]}",
        user_id=request.user_id,
        amount=request.amount,
        currency=request.currency,
        status=result.status.value,
        provider=provider.provider_name,
        provider_payment_id=result.provider_payment_id,
        description=request.description,
        metadata_json=json.dumps(request.metadata) if request.metadata else None
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse(
        payment_id=payment.payment_id,
        status=payment.status,
        amount=payment.amount,
        currency=payment.currency,
        provider=payment.provider,
        provider_payment_id=payment.provider_payment_id,
        message=result.message,
        redirect_url=result.redirect_url,
        created_at=payment.created_at.isoformat()
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, db: Session = Depends(get_db)):
    """Obtener estado de un pago"""
    
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "status": 404,
                "error": "NOT_FOUND",
                "message": "Pago no encontrado",
                "details": [{"code": "PAY_NOT_FOUND", "message": f"Payment {payment_id} no existe"}]
            }
        )
    
    return PaymentResponse(
        payment_id=payment.payment_id,
        status=payment.status,
        amount=payment.amount,
        currency=payment.currency,
        provider=payment.provider,
        provider_payment_id=payment.provider_payment_id,
        created_at=payment.created_at.isoformat()
    )


@router.post("/{payment_id}/refund")
async def refund_payment(payment_id: str, db: Session = Depends(get_db)):
    """Reembolsar un pago"""
    
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pago no encontrado"
        )
    
    if payment.status != PaymentStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden reembolsar pagos completados"
        )
    
    provider = get_payment_provider()
    result = await provider.refund_payment(payment.provider_payment_id or payment.payment_id)
    
    if result.success:
        payment.status = PaymentStatus.REFUNDED.value
        db.commit()
    
    return {
        "success": result.success,
        "payment_id": payment_id,
        "status": payment.status,
        "message": result.message
    }


@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Listar pagos con paginación"""
    
    query = db.query(Payment)
    
    if status_filter:
        query = query.filter(Payment.status == status_filter)
    
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        PaymentResponse(
            payment_id=p.payment_id,
            status=p.status,
            amount=p.amount,
            currency=p.currency,
            provider=p.provider,
            provider_payment_id=p.provider_payment_id,
            created_at=p.created_at.isoformat()
        )
        for p in payments
    ]
