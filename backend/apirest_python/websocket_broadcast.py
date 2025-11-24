"""
websocket_broadcast.py
Utilidad para enviar notificaciones al servidor WebSocket Ruby
"""

import httpx
import json
from typing import Dict, Any

WEBSOCKET_BROADCAST_URL = "http://localhost:8081/broadcast"

async def send_websocket_broadcast(channel: str, event: str, data: Dict[str, Any]):
    """
    Enviar una notificación al servidor WebSocket
    
    Args:
        channel: Canal del WebSocket ('fila_virtual', 'mesas', 'reservas')
        event: Tipo de evento ('update', 'create', 'delete', etc.)
        data: Datos del evento
    """
    try:
        message = {
            "channel": channel,
            "event": event,
            "data": data
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                WEBSOCKET_BROADCAST_URL,
                json=message,
                timeout=2.0  # 2 segundos timeout
            )
            
            if response.status_code == 200:
                print(f"✅ Broadcast enviado a WebSocket: {channel}/{event}")
            else:
                print(f"⚠️ Error al enviar broadcast: {response.status_code}")
                
    except httpx.ConnectError:
        print(f"⚠️ WebSocket server no disponible en {WEBSOCKET_BROADCAST_URL}")
    except Exception as e:
        print(f"❌ Error al enviar broadcast: {str(e)}")


# Funciones específicas por canal

async def broadcast_fila_virtual(event: str, data: Dict[str, Any]):
    """Enviar notificación al canal de fila virtual"""
    await send_websocket_broadcast("fila_virtual", event, data)


async def broadcast_mesas(event: str, data: Dict[str, Any]):
    """Enviar notificación al canal de mesas"""
    await send_websocket_broadcast("mesas", event, data)


async def broadcast_reservas(event: str, data: Dict[str, Any]):
    """Enviar notificación al canal de reservas"""
    await send_websocket_broadcast("reservas", event, data)

async def broadcast_reportes(event: str, data: Dict[str, Any]):
    """Enviar notificación al canal de reportes (generación de PDFs, etc.)"""
    await send_websocket_broadcast("reportes", event, data)
