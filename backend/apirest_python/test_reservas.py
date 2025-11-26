#!/usr/bin/env python
"""
Script de prueba para verificar el endpoint de reservas
"""
import requests
import json

API_URL = "http://localhost:8000"

def test_get_reservas():
    """Prueba GET /reservas/"""
    print("=" * 50)
    print("TEST: GET /reservas/")
    print("=" * 50)
    try:
        response = requests.get(f"{API_URL}/reservas/")
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        data = response.json()
        print(f"Respuesta: {json.dumps(data, indent=2, ensure_ascii=False)}")
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_post_reserva(reserva_data):
    """Prueba POST /reserva/"""
    print("\n" + "=" * 50)
    print("TEST: POST /reserva/")
    print("=" * 50)
    print(f"Enviando: {json.dumps(reserva_data, indent=2, ensure_ascii=False)}")
    try:
        response = requests.post(f"{API_URL}/reserva/", json=reserva_data)
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        data = response.json()
        print(f"Respuesta: {json.dumps(data, indent=2, ensure_ascii=False)}")
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Obtener reservas actuales
    reservas = test_get_reservas()
    
    # Crear una nueva reserva de prueba
    reserva_nueva = {
        "id_cliente": 1,
        "id_mesa": 1,
        "fecha": "2025-11-25",
        "hora_inicio": "19:00",
        "hora_fin": "21:00",
        "estado": "pendiente",
        "nombre": "Juan Pérez",
        "telefono": "099-123-4567",
        "email": "juan@example.com",
        "numero_personas": 4,
        "ocasion_especial": "cumpleanos",
        "comentarios": "Mesa cerca de la ventana por favor"
    }
    
    resultado = test_post_reserva(reserva_nueva)
    
    # Verificar que se guardó
    if resultado:
        print("\n" + "=" * 50)
        print("Verificando reservas después de crear una nueva:")
        print("=" * 50)
        reservas_after = test_get_reservas()
        if reservas_after:
            print(f"\nTotal de reservas: {len(reservas_after)}")
            if len(reservas_after) > 0:
                print(f"Última reserva: {json.dumps(reservas_after[-1], indent=2, ensure_ascii=False)}")
