"""
Manejo de JWT - Access y Refresh Tokens
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from jose import jwt, JWTError
from config import get_settings

settings = get_settings()


def create_access_token(
    subject: str,
    user_id: int,
    is_admin: bool = False,
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, str, datetime]:
    """
    Crea un access token JWT
    
    Args:
        subject: Username o identificador del usuario
        user_id: ID del usuario
        is_admin: Si el usuario es administrador
        expires_delta: Tiempo de expiración personalizado
        
    Returns:
        Tuple de (token, jti, expires_at)
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    jti = str(uuid.uuid4())  # JWT ID único
    
    to_encode = {
        "sub": subject,
        "user_id": user_id,
        "is_admin": is_admin,
        "type": "access",
        "jti": jti,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt, jti, expire


def create_refresh_token(
    subject: str,
    user_id: int,
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, str, datetime]:
    """
    Crea un refresh token JWT
    
    Args:
        subject: Username o identificador del usuario
        user_id: ID del usuario
        expires_delta: Tiempo de expiración personalizado
        
    Returns:
        Tuple de (token, jti, expires_at)
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
    
    jti = str(uuid.uuid4())
    
    to_encode = {
        "sub": subject,
        "user_id": user_id,
        "type": "refresh",
        "jti": jti,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt, jti, expire


def verify_token(token: str) -> Optional[dict]:
    """
    Verifica y decodifica un token JWT
    
    Args:
        token: Token JWT a verificar
        
    Returns:
        Payload del token si es válido, None si no
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None


def decode_token(token: str) -> Optional[dict]:
    """
    Decodifica un token sin verificar expiración
    Útil para obtener info de tokens expirados
    
    Args:
        token: Token JWT
        
    Returns:
        Payload del token o None
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": False}
        )
        return payload
    except JWTError:
        return None
