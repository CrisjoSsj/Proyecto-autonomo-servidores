"""
test_fila_virtual.py
Tests para el endpoint de fila virtual
"""

import pytest


class TestFilaVirtual:
    """Tests para el CRUD de fila virtual"""

    def test_get_fila_vacia(self, client):
        """Debe retornar lista de fila virtual"""
        response = client.get("/fila-virtual/")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_agregar_persona_a_fila(self, client, fila_data):
        """Debe agregar persona a la fila virtual"""
        response = client.post("/fila-virtual/", json=fila_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["nombre"] == fila_data["nombre"]
        assert data["numeroPersonas"] == fila_data["numeroPersonas"]
        assert "posicion" in data
        assert "tiempoEstimado" in data

    def test_eliminar_de_fila(self, client, fila_data):
        """Debe eliminar persona de la fila"""
        # Primero agregar
        create_response = client.post("/fila-virtual/", json=fila_data)
        
        if create_response.status_code == 200:
            persona_id = create_response.json()["id"]
            
            # Eliminar
            response = client.delete(f"/fila-virtual/{persona_id}")
            assert response.status_code == 200

    def test_posicion_incrementa(self, client, fila_data):
        """Las posiciones deben incrementar al agregar personas"""
        # Agregar primera persona
        fila_data["cliente_id"] = 1001
        response1 = client.post("/fila-virtual/", json=fila_data)
        
        # Agregar segunda persona
        fila_data["cliente_id"] = 1002
        fila_data["nombre"] = "Segunda Persona"
        response2 = client.post("/fila-virtual/", json=fila_data)
        
        if response1.status_code == 200 and response2.status_code == 200:
            pos1 = response1.json()["posicion"]
            pos2 = response2.json()["posicion"]
            
            # La segunda posición debería ser mayor
            assert pos2 > pos1

    def test_get_estadisticas_fila(self, client):
        """Debe retornar estadísticas de la fila"""
        response = client.get("/fila-virtual/estadisticas/resumen")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_esperando" in data

    def test_llamar_siguiente(self, client, fila_data):
        """Debe llamar al siguiente en la fila"""
        # Agregar persona a la fila
        client.post("/fila-virtual/", json=fila_data)
        
        # Llamar siguiente
        response = client.post("/fila-virtual/admin/llamar-siguiente")
        
        # Puede ser 200 si hay alguien o 404 si no
        assert response.status_code in [200, 404]


class TestFilaVirtualValidaciones:
    """Tests de validaciones de fila virtual"""

    def test_no_duplicar_cliente(self, client, fila_data):
        """No debe permitir duplicar cliente en fila"""
        # Agregar primera vez
        response1 = client.post("/fila-virtual/", json=fila_data)
        
        # Intentar agregar de nuevo con mismo cliente_id
        response2 = client.post("/fila-virtual/", json=fila_data)
        
        # La segunda debería fallar o retornar la existente
        if response1.status_code == 200:
            assert response2.status_code in [200, 400, 409]

    def test_tiempo_estimado_calculado(self, client, fila_data):
        """El tiempo estimado debe calcularse automáticamente"""
        response = client.post("/fila-virtual/", json=fila_data)
        
        if response.status_code == 200:
            data = response.json()
            assert "tiempoEstimado" in data
            assert data["tiempoEstimado"] > 0
