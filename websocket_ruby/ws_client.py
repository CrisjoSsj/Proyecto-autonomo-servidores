import websocket
import json

ws = websocket.WebSocket()
ws.connect("ws://localhost:8080")

data = {
    "channel": "fila_virtual",
    "action": "join",
    "id_cliente": 1,
    "nombre": "Joustin"
}

ws.send(json.dumps(data))
print(ws.recv())
ws.close()
