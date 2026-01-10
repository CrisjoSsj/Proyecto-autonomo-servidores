"""
Rate Limiter para proteger endpoints de login
Previene ataques de fuerza bruta
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Limiter usando IP como key
limiter = Limiter(key_func=get_remote_address)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Handler personalizado para rate limit excedido
    """
    return JSONResponse(
        status_code=429,
        content={
            "status": 429,
            "error": "RATE_LIMIT_EXCEEDED",
            "message": "Demasiados intentos. Por favor espera antes de intentar de nuevo.",
            "details": [{
                "code": "AUTH_RATE_LIMITED",
                "message": f"Límite de solicitudes excedido: {exc.detail}"
            }]
        }
    )
