"""
Configuración del AI Orchestrator
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración del orquestador de IA"""
    
    # JWT (para validación local)
    jwt_secret: str = os.getenv("JWT_SECRET", "chuwue_grill_secret_key_cambiar_en_produccion")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # LLM Provider
    llm_provider: str = os.getenv("LLM_PROVIDER", "groq")  # groq, mock
    
    # Groq
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
    groq_vision_model: str = os.getenv("GROQ_VISION_MODEL", "mixtral-8x7b-32768")
    
    # Core API
    core_api_url: str = os.getenv("CORE_API_URL", "http://localhost:8000")
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/chat.db")
    
    # CORS
    cors_origins: list = ["http://localhost:5173", "http://localhost:80", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
