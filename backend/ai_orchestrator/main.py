"""
AI Orchestrator - Microservicio de IA
Chuwue Grill - Segundo Parcial

Incluye:
- Chat con LLM (Groq/Mock)
- MCP Server con 5 herramientas
- Soporte multimodal (texto + imágenes)
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import init_db
from routers.chat import router as chat_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación"""
    print("🚀 Iniciando AI Orchestrator...")
    init_db()
    print(f"✅ AI Orchestrator listo (Provider: {settings.llm_provider})")
    yield
    print("👋 AI Orchestrator cerrado")


app = FastAPI(
    title="AI Orchestrator - Chuwue Grill",
    description="Microservicio de IA con MCP Tools",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/chat/docs",
    redoc_url="/chat/redoc"
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
app.include_router(chat_router)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai_orchestrator",
        "version": "2.0.0",
        "llm_provider": settings.llm_provider
    }


@app.get("/")
async def root():
    return {
        "service": "AI Orchestrator",
        "description": "Microservicio de IA con MCP - Chuwue Grill",
        "docs": "/chat/docs",
        "provider": settings.llm_provider,
        "tools": ["buscar_platos", "ver_reserva", "crear_reserva", "registrar_cliente", "resumen_ventas"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=True)
