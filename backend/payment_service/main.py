"""
Payment Service - Microservicio de Pagos
Chuwue Grill - Segundo Parcial

Incluye:
- Pasarela de pago con patrón Adapter (Mock, Stripe)
- Webhooks de pasarelas
- Registro de Partners B2B
- Webhooks bidireccionales con HMAC
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import init_db
from routers.payments import router as payments_router
from routers.webhooks import router as webhooks_router
from routers.partners import router as partners_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación"""
    print("🚀 Iniciando Payment Service...")
    init_db()
    print(f"✅ Payment Service listo (Provider: {settings.payment_provider})")
    yield
    print("👋 Payment Service cerrado")


app = FastAPI(
    title="Payment Service - Chuwue Grill",
    description="Microservicio de pagos con webhooks B2B",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(payments_router)
app.include_router(webhooks_router)
app.include_router(partners_router)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "payment_service",
        "version": "2.0.0",
        "provider": settings.payment_provider
    }


@app.get("/")
async def root():
    return {
        "service": "Payment Service",
        "description": "Microservicio de pagos - Chuwue Grill",
        "docs": "/docs",
        "provider": settings.payment_provider
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=True)
