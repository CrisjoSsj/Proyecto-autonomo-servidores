"""
Auth Service - Microservicio de Autenticación
Chuwue Grill - Segundo Parcial

Endpoints:
- POST /auth/register - Registrar usuario
- POST /auth/login - Iniciar sesión
- POST /auth/logout - Cerrar sesión
- POST /auth/refresh - Renovar tokens
- GET /auth/me - Usuario actual
- GET /auth/validate - Validar token (interno)
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import get_settings
from database import init_db, get_db, SessionLocal
from routers.auth import router as auth_router
from routers.users import router as users_router
from middleware.rate_limiter import limiter, rate_limit_exceeded_handler
from models.user import User
from utils.password import hash_password

settings = get_settings()


def create_default_admin():
    """Crea un usuario admin por defecto si no existe"""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@chuwuegrill.com",
                full_name="Administrador",
                telefono="0999999999",
                hashed_password=hash_password("admin123"),
                is_active=True,
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print("✅ Usuario admin creado: admin@chuwuegrill.com / admin123")
    except Exception as e:
        print(f"⚠️ Error creando admin: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación"""
    # Startup
    print("🚀 Iniciando Auth Service...")
    init_db()
    create_default_admin()
    print("✅ Auth Service listo")
    yield
    # Shutdown
    print("👋 Auth Service cerrado")


# Crear aplicación
app = FastAPI(
    title="Auth Service - Chuwue Grill",
    description="Microservicio de autenticación con JWT y refresh tokens",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/auth/docs",
    redoc_url="/auth/redoc",
    openapi_url="/auth/openapi.json"
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(users_router)


@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "ok",
        "service": "auth_service",
        "version": "2.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Auth Service",
        "description": "Microservicio de autenticación - Chuwue Grill",
        "docs": "/auth/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
