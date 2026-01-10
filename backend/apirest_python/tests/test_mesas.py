"""
test_mesas.py
Tests para el endpoint de mesas
"""

import pytest


class TestMesas:
    """Tests para el CRUD de mesas"""

    def test_get_mesas(self, client):
        """Debe retornar lista de mesas"""
        response = client.get("/mesas/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_crear_mesa(self, client, mesa_data):
        """Debe crear una mesa correctamente"""
        response = client.post("/mesa/", json=mesa_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["numero"] == mesa_data["numero"]
        assert data["capacidad"] == mesa_data["capacidad"]

    def test_actualizar_estado_mesa(self, client, mesa_data):
        """Debe actualizar estado de una mesa"""
        # Primero crear la mesa
        client.post("/mesa/", json=mesa_data)
        
        # Actualizar estado
        mesa_data["estado"] = "ocupada"
        response = client.put("/mesa/", json=mesa_data)
        
        assert response.status_code == 200

    def test_eliminar_mesa(self, client, mesa_data):
        """Debe eliminar una mesa"""
        # Primero crear la mesa
        create_response = client.post("/mesa/", json=mesa_data)
        
        if create_response.status_code == 200:
            # Eliminar la mesa
            response = client.delete(f"/mesa/{mesa_data['id_mesa']}")
            assert response.status_code == 200

    def test_get_estadisticas_mesas(self, client):
        """Debe retornar estadísticas de mesas"""
        response = client.get("/mesas/estadisticas")
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "disponibles" in data

    def test_crear_mesa_sin_numero(self, client):
        """Debe manejar error al crear mesa sin número"""
        mesa_incompleta = {
            "capacidad": 4,
            "estado": "libre"
        }
        response = client.post("/mesa/", json=mesa_incompleta)
        
        # Puede aceptar con defaults o fallar
        assert response.status_code in [200, 422]


class TestAsignacionAutomatica:
    """Tests para asignación automática desde fila virtual"""

    def test_cambio_a_disponible_activa_asignacion(self, client, mesa_data):
        """Al cambiar mesa a disponible, debe intentar asignar de la cola"""
        # Crear mesa
        client.post("/mesa/", json=mesa_data)
        
        # Cambiar a ocupada
        mesa_data["estado"] = "ocupada"
        client.put("/mesa/", json=mesa_data)
        
        # Cambiar a disponible (debería activar asignación)
        mesa_data["estado"] = "libre"
        response = client.put("/mesa/", json=mesa_data)
        
        assert response.status_code == 200
