"""
Normalizador de eventos de diferentes pasarelas
"""
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class NormalizedEvent:
    """Evento normalizado de cualquier fuente"""
    event_type: str
    payment_id: str
    status: str
    amount: float
    currency: str
    customer_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    source: str = "unknown"


def normalize_event(raw_event: dict, source: str) -> NormalizedEvent:
    """
    Normaliza eventos de diferentes fuentes a formato común
    
    Args:
        raw_event: Evento crudo de la pasarela
        source: Fuente del evento (stripe, mock, mercadopago)
        
    Returns:
        NormalizedEvent con formato estándar
    """
    
    if source == "stripe":
        return _normalize_stripe(raw_event)
    elif source == "mock":
        return _normalize_mock(raw_event)
    else:
        return _normalize_generic(raw_event, source)


def _normalize_stripe(event: dict) -> NormalizedEvent:
    """Normaliza evento de Stripe"""
    
    event_type_map = {
        "payment_intent.succeeded": "payment.success",
        "payment_intent.payment_failed": "payment.failed",
        "charge.refunded": "payment.refunded",
        "customer.created": "customer.created",
    }
    
    obj = event.get("data", {}).get("object", {})
    
    return NormalizedEvent(
        event_type=event_type_map.get(event.get("type", ""), event.get("type", "unknown")),
        payment_id=obj.get("id", ""),
        status=obj.get("status", "unknown"),
        amount=obj.get("amount", 0) / 100,  # Stripe usa centavos
        currency=obj.get("currency", "usd").upper(),
        customer_id=obj.get("customer"),
        metadata=obj.get("metadata"),
        source="stripe"
    )


def _normalize_mock(event: dict) -> NormalizedEvent:
    """Normaliza evento mock"""
    
    return NormalizedEvent(
        event_type=event.get("event_type", "unknown"),
        payment_id=event.get("payment_id", ""),
        status=event.get("status", "unknown"),
        amount=event.get("amount", 0),
        currency=event.get("currency", "USD"),
        metadata=event.get("metadata"),
        source="mock"
    )


def _normalize_generic(event: dict, source: str) -> NormalizedEvent:
    """Normaliza evento genérico"""
    
    return NormalizedEvent(
        event_type=event.get("event_type", event.get("type", "unknown")),
        payment_id=event.get("payment_id", event.get("id", "")),
        status=event.get("status", "unknown"),
        amount=event.get("amount", 0),
        currency=event.get("currency", "USD"),
        metadata=event.get("metadata", event.get("data")),
        source=source
    )
