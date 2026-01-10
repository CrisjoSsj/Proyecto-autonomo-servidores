"""
Router de Autenticación
Endpoints: register, login, logout, refresh
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db
from models.user import User
from models.refresh_token import RefreshToken
from models.revoked_token import RevokedToken
from utils.password import hash_password, verify_password
from utils.jwt_handler import (
    create_access_token,
    create_refresh_token,
    verify_token,
    decode_token
)
from middleware.rate_limiter import limiter

router = APIRouter(prefix="/auth", tags=["Autenticación"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ============================================
# Schemas
# ============================================

class UserCreate(BaseModel):
    """Schema para registro de usuario"""
    username: str
    email: EmailStr
    full_name: str
    telefono: Optional[str] = None
    password: str


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


class LoginRequest(BaseModel):
    """Schema para login JSON"""
    email: str
    password: str
    is_admin: bool = False


class TokenResponse(BaseModel):
    """Schema de respuesta de tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshRequest(BaseModel):
    """Schema para refresh token"""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Schema para logout"""
    refresh_token: Optional[str] = None


# ============================================
# Endpoints
# ============================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrar un nuevo usuario
    
    - **username**: Nombre de usuario único
    - **email**: Email único
    - **full_name**: Nombre completo
    - **password**: Contraseña (mínimo 6 caracteres)
    """
    # Verificar si username existe
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "status": 400,
                "error": "VALIDATION_ERROR",
                "message": "El nombre de usuario ya existe",
                "details": [{"field": "username", "code": "AUTH_USERNAME_EXISTS", "message": "Username en uso"}]
            }
        )
    
    # Verificar si email existe
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "status": 400,
                "error": "VALIDATION_ERROR",
                "message": "El email ya está registrado",
                "details": [{"field": "email", "code": "AUTH_EMAIL_EXISTS", "message": "Email en uso"}]
            }
        )
    
    # Crear usuario
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        telefono=user_data.telefono,
        hashed_password=hash_password(user_data.password),
        is_active=True,
        is_admin=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Iniciar sesión y obtener tokens
    
    - **email**: Email del usuario
    - **password**: Contraseña
    - **is_admin**: Si requiere acceso de administrador
    
    Returns:
        access_token, refresh_token y datos del usuario
    """
    # Buscar usuario por email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Credenciales incorrectas",
                "details": [{"code": "AUTH_INVALID_CREDENTIALS", "message": "Email o contraseña incorrectos"}]
            }
        )
    
    # Verificar contraseña
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Credenciales incorrectas",
                "details": [{"code": "AUTH_INVALID_CREDENTIALS", "message": "Email o contraseña incorrectos"}]
            }
        )
    
    # Verificar si usuario está activo
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
    
    # Verificar si requiere admin
    if credentials.is_admin and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": 403,
                "error": "FORBIDDEN",
                "message": "Se requieren permisos de administrador",
                "details": [{"code": "AUTH_ADMIN_REQUIRED", "message": "No tienes permisos de admin"}]
            }
        )
    
    # Crear tokens
    access_token, access_jti, access_exp = create_access_token(
        subject=user.username,
        user_id=user.id,
        is_admin=user.is_admin
    )
    
    refresh_token, refresh_jti, refresh_exp = create_refresh_token(
        subject=user.username,
        user_id=user.id
    )
    
    # Guardar refresh token en BD
    db_refresh = RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=refresh_exp,
        ip_address=request.client.host if request.client else None
    )
    db.add(db_refresh)
    db.commit()
    
    # Calcular expires_in en segundos
    expires_in = int((access_exp - datetime.now(timezone.utc)).total_seconds())
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        user=UserResponse.model_validate(user)
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    logout_data: LogoutRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Cerrar sesión y revocar tokens
    
    - **refresh_token**: Token de refresh a revocar (opcional)
    """
    # Decodificar access token
    payload = decode_token(token)
    if payload:
        jti = payload.get("jti")
        exp = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)
        
        # Revocar access token
        revoked = RevokedToken(
            jti=jti,
            token_type="access",
            expires_at=exp,
            reason="logout"
        )
        db.add(revoked)
    
    # Revocar refresh token si se proporciona
    if logout_data.refresh_token:
        refresh_payload = decode_token(logout_data.refresh_token)
        if refresh_payload:
            refresh_jti = refresh_payload.get("jti")
            refresh_exp = datetime.fromtimestamp(refresh_payload.get("exp", 0), tz=timezone.utc)
            
            # Marcar refresh token como revocado en BD
            db_refresh = db.query(RefreshToken).filter(
                RefreshToken.token == logout_data.refresh_token
            ).first()
            if db_refresh:
                db_refresh.is_revoked = True
            
            # Agregar a blacklist
            revoked_refresh = RevokedToken(
                jti=refresh_jti,
                token_type="refresh",
                expires_at=refresh_exp,
                reason="logout"
            )
            db.add(revoked_refresh)
    
    db.commit()
    
    return {"message": "Sesión cerrada exitosamente"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    refresh_data: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Renovar access token usando refresh token
    
    - **refresh_token**: Token de refresh válido
    """
    # Verificar refresh token
    payload = verify_token(refresh_data.refresh_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Token de refresh inválido o expirado",
                "details": [{"code": "AUTH_INVALID_REFRESH_TOKEN", "message": "El refresh token no es válido"}]
            }
        )
    
    # Verificar que sea un refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Token inválido",
                "details": [{"code": "AUTH_WRONG_TOKEN_TYPE", "message": "Se esperaba un refresh token"}]
            }
        )
    
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
    
    # Verificar en BD
    db_refresh = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_data.refresh_token,
        RefreshToken.is_revoked == False
    ).first()
    
    if not db_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Token de refresh no encontrado",
                "details": [{"code": "AUTH_REFRESH_NOT_FOUND", "message": "Refresh token no existe"}]
            }
        )
    
    # Obtener usuario
    user = db.query(User).filter(User.id == db_refresh.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Usuario no válido",
                "details": [{"code": "AUTH_USER_INVALID", "message": "Usuario no encontrado o desactivado"}]
            }
        )
    
    # Revocar refresh token antiguo
    db_refresh.is_revoked = True
    old_revoked = RevokedToken(
        jti=jti,
        token_type="refresh",
        expires_at=datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc),
        reason="refresh_rotation"
    )
    db.add(old_revoked)
    
    # Crear nuevos tokens
    access_token, access_jti, access_exp = create_access_token(
        subject=user.username,
        user_id=user.id,
        is_admin=user.is_admin
    )
    
    new_refresh_token, refresh_jti, refresh_exp = create_refresh_token(
        subject=user.username,
        user_id=user.id
    )
    
    # Guardar nuevo refresh token
    new_db_refresh = RefreshToken(
        token=new_refresh_token,
        user_id=user.id,
        expires_at=refresh_exp,
        ip_address=request.client.host if request.client else None
    )
    db.add(new_db_refresh)
    db.commit()
    
    expires_in = int((access_exp - datetime.now(timezone.utc)).total_seconds())
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        user=UserResponse.model_validate(user)
    )
