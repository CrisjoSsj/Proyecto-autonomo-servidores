"""
Configuración del Auth Service
Variables de entorno y constantes
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración del servicio de autenticación"""
    
    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "chuwue_grill_secret_key_cambiar_en_produccion")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/auth.db")
    
    # Rate Limiting
    rate_limit_per_minute: int = 10  # Intentos de login por minuto
    
    # CORS
    cors_origins: list = ["http://localhost:5173", "http://localhost:80", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Obtiene la configuración cacheada"""
    return Settings()
