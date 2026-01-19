import asyncio
import os
from app.celery_app import celery

# Simple script to enqueue a tool job and print task id

def enqueue_tool():
    res = celery.send_task('app.tasks.tool_execute_task', args=['buscar_productos', {'q': 'Test'}])
    print('enqueued task id', res.id)


if __name__ == '__main__':
    enqueue_tool()
