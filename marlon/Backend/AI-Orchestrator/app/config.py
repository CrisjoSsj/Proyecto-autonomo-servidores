from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str | None = None
    HUGGINGFACE_API_KEY: str | None = None
    # Modelo para text generation - use uno compatible con Inference Providers (router.huggingface.co)
    # Modelos gratuitos: "Qwen/Qwen2.5-72B-Instruct", "meta-llama/Llama-3.3-70B-Instruct"
    HF_DEFAULT_MODEL: str | None = "Qwen/Qwen2.5-72B-Instruct"
    HF_EMBEDDING_MODEL: str | None = "sentence-transformers/all-mpnet-base-v2"
    HF_LOCAL_MODEL: str | None = None  # path or model id for local fallback
    HF_USE_LOCAL: bool = False

    QDRANT_URL: str | None = None
    QDRANT_API_KEY: str | None = None
    JWKS_URL: str | None = None

    # Tools / Django integration
    DJANGO_TOOLS_URL: str | None = "http://django:8000/api_rest/tools"
    TOOLS_API_KEY: str | None = "dev-secret"

    HOST: str = "0.0.0.0"
    PORT: int = 8080

    # Celery/Redis
    CELERY_BROKER_URL: str | None = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str | None = "redis://redis:6379/1"

    # Proposal store (optional). If not provided, the in-memory store is used.
    PROPOSAL_REDIS_URL: str | None = None
    PROPOSAL_TTL_SECONDS: int = 3600

    class Config:
        env_file = ".env"


settings = Settings()
