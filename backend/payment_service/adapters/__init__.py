"""
Adapters de Payment Providers
Patrón Adapter para abstraer diferentes pasarelas de pago
"""
from .base import PaymentProvider, PaymentResult
from .mock_adapter import MockAdapter
from .stripe_adapter import StripeAdapter

__all__ = ["PaymentProvider", "PaymentResult", "MockAdapter", "StripeAdapter"]
