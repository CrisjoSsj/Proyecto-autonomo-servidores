from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import ingest, chat
from app.config import settings

app = FastAPI(title="AI Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])

# Tools endpoint group (reuse chat router for tool call)
from app.routes import chat as chat_routes
app.include_router(chat_routes.router, prefix="/api", tags=["tools"])

# Dedicated tools router for propose/confirm flows
from app.routes import tools as tools_routes
app.include_router(tools_routes.router, prefix="/api/tools", tags=["tools"])

# Jobs / background tasks
from app.routes import jobs as jobs_routes
app.include_router(jobs_routes.router, prefix="/api", tags=["jobs"])

@app.get("/health")
async def health():
    return {"status": "ok"}
