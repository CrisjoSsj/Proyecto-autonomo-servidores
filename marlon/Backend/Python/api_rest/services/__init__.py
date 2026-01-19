"""
Services module for api_rest
============================

Pilar 2: Webhooks e Interoperabilidad B2B
Pilar 4: n8n - Event Bus
"""
from .event_bus import event_bus
from .webhooks import webhook_dispatcher
from .payment_service import payment_service, PaymentService, PaymentProvider

__all__ = [
    'event_bus',
    'webhook_dispatcher',
    'payment_service',
    'PaymentService',
    'PaymentProvider',
]
