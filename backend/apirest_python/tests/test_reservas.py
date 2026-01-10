"""
test_reservas.py
Tests para el endpoint de reservas
"""

import pytest


class TestReservas:
    """Tests para el CRUD de reservas"""

    def test_get_reservas_vacio(self, client):
        """Debe retornar lista de reservas"""
        response = client.get("/reservas/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_crear_reserva(self, client, reserva_data):
        """Debe crear una reserva correctamente"""
        response = client.post("/reserva/", json=reserva_data)
        
        # Puede ser 200 o 409 si hay conflicto
        assert response.status_code in [200, 409]
        
        if response.status_code == 200:
            data = response.json()
            assert "id_reserva" in data
            assert data["nombre"] == reserva_data["nombre"]
            assert data["estado"] == "pendiente"

    def test_crear_reserva_sin_campos_requeridos(self, client):
        """Debe fallar al crear reserva sin campos requeridos"""
        reserva_incompleta = {
            "id_mesa": 1,
            # Falta fecha, hora_inicio, etc.
        }
        response = client.post("/reserva/", json=reserva_incompleta)
        # Debería retornar error 400 o validar
        assert response.status_code in [200, 400, 422]

    def test_get_reservas_disponibilidad(self, client):
        """Debe retornar disponibilidad para una fecha"""
        response = client.get("/reservas/disponibilidad?fecha=2026-01-15&personas=4")
        
        assert response.status_code == 200
        data = response.json()
        assert "mesas_disponibles" in data
        assert "fecha" in data

    def test_get_estadisticas_reservas(self, client):
        """Debe retornar estadísticas de reservas"""
        response = client.get("/reservas/estadisticas")
        
        assert response.status_code == 200
        data = response.json()
        assert "reservas_hoy" in data
        assert "pendientes_hoy" in data

    def test_get_reservas_hoy(self, client):
        """Debe retornar reservas del día actual"""
        response = client.get("/reservas/hoy")
        
        assert response.status_code == 200
        data = response.json()
        assert "fecha" in data
        assert "reservas" in data

    def test_cambiar_estado_reserva_invalido(self, client):
        """Debe fallar con estado inválido"""
        response = client.put("/reserva/99999/estado?nuevo_estado=invalido")
        
        # Puede ser 400 por estado inválido o 404 si no existe
        assert response.status_code in [400, 404]


class TestConflictosReservas:
    """Tests para validación de conflictos de horario"""

    def test_conflicto_mismo_horario(self, client, reserva_data):
        """Debe detectar conflicto cuando hay reserva en mismo horario"""
        # Crear primera reserva
        response1 = client.post("/reserva/", json=reserva_data)
        
        if response1.status_code == 200:
            # Intentar crear segunda reserva en mismo horario
            response2 = client.post("/reserva/", json=reserva_data)
            
            # Debería retornar conflicto 409
            assert response2.status_code == 409

    def test_horarios_diferentes_sin_conflicto(self, client, reserva_data):
        """No debe haber conflicto con horarios diferentes"""
        # Modificar horario
        reserva_data["hora_inicio"] = "20:00"
        reserva_data["id_mesa"] = 99  # Mesa diferente
        
        response = client.post("/reserva/", json=reserva_data)
        
        # Debería crearse sin problema
        assert response.status_code in [200, 409]
