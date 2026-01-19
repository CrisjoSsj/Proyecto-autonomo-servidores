from celery import shared_task
from typing import Any, Dict
from pathlib import Path
import traceback

from app.ingest import ingest_document
from app.tools import get_default_registry


@shared_task(bind=True)
def ingest_task(self, file_path: str, collection_name: str = "documents") -> Dict[str, Any]:
    """Background ingest task. `file_path` must be accessible to worker (shared volume or URL).

    Returns: {"status": "ok", "chunks": n} on success.
    """
    try:
        path = Path(file_path)
        res = ingest_document(path, collection_name=collection_name)
        # ingest_document is async; call if coroutine
        import asyncio
        if hasattr(res, '__await__'):
            res = asyncio.get_event_loop().run_until_complete(res)
        return {"status": "ok", "result": res}
    except Exception as e:
        # Capture exception to let Celery record failure
        tb = traceback.format_exc()
        return {"status": "error", "error": str(e), "traceback": tb}


@shared_task(bind=True)
def tool_execute_task(self, tool_name: str, params: Dict[str, Any], confirm: bool = False) -> Dict[str, Any]:
    try:
        registry = get_default_registry()
        # registry.execute is async
        import asyncio
        res = asyncio.get_event_loop().run_until_complete(registry.execute(tool_name, params or {}, confirm=confirm))
        return {"status": "ok", "result": res}
    except Exception as e:
        tb = traceback.format_exc()
        return {"status": "error", "error": str(e), "traceback": tb}
