"""
Validador de JWT Local
Permite a otros servicios validar tokens sin llamar al Auth Service
"""
import os
from datetime import datetime, timezone
from typing import Optional, Tuple
from jose import jwt, JWTError


# Configuración compartida - DEBE coincidir con Auth Service
JWT_SECRET = os.getenv("JWT_SECRET", "chuwue_grill_secret_key_cambiar_en_produccion")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def validate_jwt_local(token: str) -> Tuple[bool, Optional[dict], Optional[str]]:
    """
    Valida un token JWT localmente
    
    Esta función permite a cualquier microservicio validar tokens
    sin necesidad de llamar al Auth Service en cada request.
    
    Args:
        token: Token JWT a validar
        
    Returns:
        Tuple de (is_valid, payload, error_message)
        
    Uso:
        is_valid, payload, error = validate_jwt_local(token)
        if not is_valid:
            raise HTTPException(401, error)
        user_id = payload["user_id"]
    """
    try:
        # Decodificar y verificar
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        
        # Verificar tipo de token
        if payload.get("type") != "access":
            return False, None, "Tipo de token inválido"
        
        # Verificar expiración (jwt.decode ya lo hace, pero verificamos manualmente)
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            return False, None, "Token expirado"
        
        return True, payload, None
        
    except JWTError as e:
        return False, None, f"Token inválido: {str(e)}"
    except Exception as e:
        return False, None, f"Error de validación: {str(e)}"


def get_user_from_token(token: str) -> Optional[dict]:
    """
    Extrae información del usuario desde un token
    
    Args:
        token: Token JWT
        
    Returns:
        Dict con user_id, username, is_admin o None
    """
    is_valid, payload, _ = validate_jwt_local(token)
    if not is_valid:
        return None
    
    return {
        "user_id": payload.get("user_id"),
        "username": payload.get("sub"),
        "is_admin": payload.get("is_admin", False)
    }
