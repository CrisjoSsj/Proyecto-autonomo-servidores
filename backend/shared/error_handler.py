"""
Estructura de Errores Estandarizada
Formato uniforme de errores para todos los microservicios
"""
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Request
from fastapi.responses import JSONResponse


class ErrorDetail(BaseModel):
    """Detalle de un error específico"""
    field: Optional[str] = None
    message: str
    code: str


class APIError(BaseModel):
    """Error estándar de API"""
    status: int
    error: str
    message: str
    details: Optional[List[ErrorDetail]] = None
    timestamp: str
    path: str
    request_id: Optional[str] = None


def create_error_response(
    status_code: int,
    error: str,
    message: str,
    request: Request,
    details: Optional[List[dict]] = None,
    request_id: Optional[str] = None
) -> JSONResponse:
    """
    Crea una respuesta de error estandarizada
    
    Args:
        status_code: Código HTTP
        error: Tipo de error (UNAUTHORIZED, VALIDATION_ERROR, etc.)
        message: Mensaje legible para el usuario
        request: Request de FastAPI
        details: Lista de detalles del error
        request_id: ID de la solicitud para trazabilidad
        
    Returns:
        JSONResponse con formato estándar
    """
    error_details = None
    if details:
        error_details = [ErrorDetail(**d) for d in details]
    
    api_error = APIError(
        status=status_code,
        error=error,
        message=message,
        details=error_details,
        timestamp=datetime.now(timezone.utc).isoformat(),
        path=str(request.url.path),
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status_code,
        content=api_error.model_dump()
    )


# Códigos de error por servicio
ERROR_CODES = {
    # Auth Service
    "AUTH_INVALID_CREDENTIALS": "Credenciales inválidas",
    "AUTH_TOKEN_EXPIRED": "Token expirado",
    "AUTH_TOKEN_REVOKED": "Token revocado",
    "AUTH_USER_DISABLED": "Usuario desactivado",
    "AUTH_ADMIN_REQUIRED": "Se requieren permisos de administrador",
    "AUTH_USERNAME_EXISTS": "Nombre de usuario ya existe",
    "AUTH_EMAIL_EXISTS": "Email ya registrado",
    "AUTH_RATE_LIMITED": "Demasiados intentos",
    
    # Payment Service
    "PAY_INSUFFICIENT_FUNDS": "Fondos insuficientes",
    "PAY_INVALID_CARD": "Tarjeta inválida",
    "PAY_PAYMENT_FAILED": "Pago fallido",
    "PAY_WEBHOOK_INVALID": "Webhook inválido",
    "PAY_PARTNER_NOT_FOUND": "Partner no encontrado",
    
    # AI Orchestrator
    "AI_MODEL_UNAVAILABLE": "Modelo de IA no disponible",
    "AI_TOOL_NOT_FOUND": "Herramienta no encontrada",
    "AI_PROCESSING_ERROR": "Error procesando solicitud",
    "AI_RATE_LIMITED": "Límite de solicitudes de IA excedido",
    
    # Partner/Webhooks
    "PARTNER_HMAC_INVALID": "Firma HMAC inválida",
    "PARTNER_NOT_REGISTERED": "Partner no registrado",
    "PARTNER_EVENT_UNKNOWN": "Evento desconocido",
    "PARTNER_WEBHOOK_FAILED": "Webhook falló",
}
