from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from celery.result import AsyncResult
from app.celery_app import celery

router = APIRouter()


class IngestJobRequest(BaseModel):
    file_path: str
    collection_name: str | None = "documents"


class ToolJobRequest(BaseModel):
    tool: str
    params: Dict | None = None
    confirm: bool | None = None


@router.post("/ingest")
async def enqueue_ingest(req: IngestJobRequest):
    # Enqueue ingest task
    task = celery.send_task('app.tasks.ingest_task', args=[req.file_path, req.collection_name])
    return {"task_id": task.id}


@router.post("/tool")
async def enqueue_tool(req: ToolJobRequest):
    task = celery.send_task('app.tasks.tool_execute_task', args=[req.tool, req.params or {}, bool(req.confirm)])
    return {"task_id": task.id}


@router.get("/jobs/{task_id}")
async def get_job(task_id: str):
    r = AsyncResult(task_id, app=celery)
    res = {"id": task_id, "status": r.status}
    if r.status == 'SUCCESS':
        res["result"] = r.result
    elif r.status in ('FAILURE', 'REVOKED'):
        res["error"] = str(r.result)
    return res
