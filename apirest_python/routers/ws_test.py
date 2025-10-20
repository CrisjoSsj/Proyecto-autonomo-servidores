from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncio
import json

router = APIRouter(prefix="/ws", tags=["ws"])


class WSMessage(BaseModel):
    type: str
    payload: dict


@router.post("/send")
async def send_ws_message(message: WSMessage):
    """Connect to the Ruby WebSocket server at ws://localhost:8080, send a message and close."""
    uri = "ws://localhost:8080"
    try:
        import websockets

        async with websockets.connect(uri) as websocket:
            await websocket.send(json.dumps({"type": message.type, "payload": message.payload}))
            # optionally wait for a response with a short timeout
            try:
                resp = await asyncio.wait_for(websocket.recv(), timeout=1.0)
            except asyncio.TimeoutError:
                resp = None

        return {"status": "sent", "response": resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
