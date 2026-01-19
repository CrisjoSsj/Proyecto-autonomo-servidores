"""
Router de Usuarios
Endpoints: me, validate
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.user import User
from models.revoked_token import RevokedToken
from utils.jwt_handler import verify_token

router = APIRouter(prefix="/auth", tags=["Usuarios"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ============================================
# Schemas
# ============================================

class UserResponse(BaseModel):
    """Schema de respuesta de usuario"""
    id: int
    username: str
    email: str
    full_name: str
    telefono: Optional[str]
    is_active: bool
    is_admin: bool
    
    class Config:
        from_attributes = True


class ValidateResponse(BaseModel):
    """Schema de validación de token"""
    valid: bool
    user_id: Optional[int] = None
    username: Optional[str] = None
    is_admin: bool = False
    expires_at: Optional[str] = None


# ============================================
# Dependencias
# ============================================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtiene el usuario actual a partir del token JWT
    Valida localmente sin llamar a otro servicio
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "status": 401,
            "error": "UNAUTHORIZED",
            "message": "No se pudo validar las credenciales",
            "details": [{"code": "AUTH_INVALID_TOKEN", "message": "Token inválido o expirado"}]
        },
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    # Verificar token
    payload = verify_token(token)
    if not payload:
        raise credentials_exception
    
    # Verificar tipo de token
    if payload.get("type") != "access":
        raise credentials_exception
    
    # Verificar que no esté revocado
    jti = payload.get("jti")
    if db.query(RevokedToken).filter(RevokedToken.jti == jti).first():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Token revocado",
                "details": [{"code": "AUTH_TOKEN_REVOKED", "message": "El token ha sido revocado"}]
            }
        )
    
    # Obtener usuario
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Usuario desactivado",
                "details": [{"code": "AUTH_USER_DISABLED", "message": "La cuenta está desactivada"}]
            }
        )
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verifica que el usuario sea administrador"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": 403,
                "error": "FORBIDDEN",
                "message": "Se requieren permisos de administrador",
                "details": [{"code": "AUTH_ADMIN_REQUIRED", "message": "No tienes permisos de admin"}]
            }
        )
    return current_user


# ============================================
# Endpoints
# ============================================

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Obtener información del usuario actual
    
    Requiere token de acceso válido
    """
    return current_user


@router.get("/validate", response_model=ValidateResponse)
async def validate_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Validar un token JWT (uso interno para otros servicios)
    
    Este endpoint permite a otros microservicios validar tokens
    sin necesidad de conocer el secret.
    
    Para validación local (recomendada), los servicios deberían
    verificar el token usando el SECRET compartido.
    """
    payload = verify_token(token)
    
    if not payload:
        return ValidateResponse(valid=False)
    
    # Verificar tipo
    if payload.get("type") != "access":
        return ValidateResponse(valid=False)
    
    # Verificar revocación
    jti = payload.get("jti")
    if db.query(RevokedToken).filter(RevokedToken.jti == jti).first():
        return ValidateResponse(valid=False)
    
    # Verificar usuario
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return ValidateResponse(valid=False)
    
    exp_timestamp = payload.get("exp")
    expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc).isoformat() if exp_timestamp else None
    
    return ValidateResponse(
        valid=True,
        user_id=user.id,
        username=user.username,
        is_admin=user.is_admin,
        expires_at=expires_at
    )


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Listar todos los usuarios (solo admin)
    """
    users = db.query(User).all()
    return users
