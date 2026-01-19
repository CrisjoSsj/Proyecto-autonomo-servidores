"""
Routers del Payment Service
"""
from .payments import router as payments_router
from .webhooks import router as webhooks_router
from .partners import router as partners_router

__all__ = ["payments_router", "webhooks_router", "partners_router"]
