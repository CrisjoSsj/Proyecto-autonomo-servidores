"""
conftest.py
Fixtures compartidos para todos los tests de la API
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Agregar el directorio padre al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


@pytest.fixture
def client():
    """Cliente de test para hacer peticiones a la API"""
    return TestClient(app)


@pytest.fixture
def reserva_data():
    """Datos de ejemplo para crear una reserva"""
    return {
        "id_cliente": 1,
        "id_mesa": 1,
        "fecha": "2026-01-15",
        "hora_inicio": "12:00",
        "nombre": "Cliente Test",
        "telefono": "0991234567",
        "email": "test@test.com",
        "numero_personas": 4,
        "estado": "pendiente"
    }


@pytest.fixture
def mesa_data():
    """Datos de ejemplo para crear una mesa"""
    return {
        "id_mesa": 100,
        "numero": 100,
        "capacidad": 6,
        "estado": "libre"
    }


@pytest.fixture
def fila_data():
    """Datos de ejemplo para agregar a la fila virtual"""
    return {
        "cliente_id": 999,
        "nombre": "Cliente Fila Test",
        "telefono": "0987654321",
        "numeroPersonas": 3,
        "hora_llegada": "2026-01-09T12:00:00",
        "estado": "esperando"
    }


@pytest.fixture
def user_data():
    """Datos de ejemplo para crear un usuario"""
    return {
        "username": "testuser",
        "full_name": "Usuario de Test",
        "email": "testuser@test.com",
        "telefono": "0991234567",
        "password": "testpass123"
    }


@pytest.fixture
def admin_credentials():
    """Credenciales de administrador para login"""
    return {
        "email": "admin@example.com",
        "password": "admin",
        "is_admin": True
    }
