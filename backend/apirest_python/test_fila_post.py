#!/usr/bin/env python3
"""
Script para probar el endpoint POST /fila-virtual/
"""
import asyncio
import httpx
import json

async def test_fila_virtual_post():
    """Test POST a /fila-virtual/"""
    url = "http://localhost:8000/fila-virtual/"
    
    # Payload con datos completos
    payload = {
        "cliente_id": 123,
        "nombre": "Juan Pérez",
        "telefono": "0912345678",
        "numeroPersonas": 4,
        "hora_llegada": "2025-11-24T10:30:00",
        "estado": "esperando"
    }
    
    print(f"📤 Enviando POST a {url}")
    print(f"📋 Payload: {json.dumps(payload, indent=2)}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            print(f"\n✅ Status: {response.status_code}")
            print(f"📦 Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"\n✅ Éxito! Respuesta: {json.dumps(data, indent=2)}")
            else:
                print(f"\n❌ Error {response.status_code}: {response.text}")
                
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_fila_virtual_post())
