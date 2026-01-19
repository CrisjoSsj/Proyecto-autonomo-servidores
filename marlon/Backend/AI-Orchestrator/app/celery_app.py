from celery import Celery
from app.config import settings

celery = Celery(
    "ai_orchestrator",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Basic recommended config
celery.conf.update(
    task_track_started=True,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
)

# Autodiscover tasks in app.tasks
celery.autodiscover_tasks(['app'])
