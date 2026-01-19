"""
Utilidades para manejo de contraseñas
Hash y verificación con bcrypt
"""
from passlib.context import CryptContext

# Contexto de encriptación con bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Genera hash bcrypt de una contraseña
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Hash bcrypt de la contraseña
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Hash almacenado
        
    Returns:
        True si coincide, False si no
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False
