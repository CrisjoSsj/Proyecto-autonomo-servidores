"""
Configuración del Payment Service
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración del servicio de pagos"""
    
    # JWT (para validación local)
    jwt_secret: str = os.getenv("JWT_SECRET", "chuwue_grill_secret_key_cambiar_en_produccion")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # Payment Provider
    payment_provider: str = os.getenv("PAYMENT_PROVIDER", "mock")  # mock, stripe
    
    # Stripe
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/payments.db")
    
    # Webhooks
    webhook_timeout: int = 30  # segundos
    webhook_retry_count: int = 3
    
    # CORS
    cors_origins: list = ["http://localhost:5173", "http://localhost:80", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
