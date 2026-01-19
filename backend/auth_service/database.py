"""
Configuración de Base de Datos SQLite
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings

settings = get_settings()

# Crear directorio data si no existe
os.makedirs("data", exist_ok=True)

# Motor de base de datos
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # Necesario para SQLite
)

# Sesión de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def get_db():
    """Dependencia para obtener sesión de BD"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Inicializa las tablas de la base de datos"""
    from models.user import User
    from models.refresh_token import RefreshToken
    from models.revoked_token import RevokedToken
    
    Base.metadata.create_all(bind=engine)
