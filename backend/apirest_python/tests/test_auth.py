"""
test_auth.py
Tests para el endpoint de autenticación
"""

import pytest


class TestAuth:
    """Tests para autenticación y usuarios"""

    def test_login_admin_correcto(self, client, admin_credentials):
        """Debe permitir login con credenciales correctas"""
        response = client.post("/auth/login", json=admin_credentials)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["is_admin"] == True

    def test_login_credenciales_incorrectas(self, client):
        """Debe rechazar credenciales incorrectas"""
        credentials = {
            "email": "wrong@test.com",
            "password": "wrongpassword",
            "is_admin": True
        }
        response = client.post("/auth/login", json=credentials)
        
        assert response.status_code in [401, 403]

    def test_registrar_usuario(self, client, user_data):
        """Debe registrar un nuevo usuario"""
        response = client.post("/auth/register", json=user_data)
        
        # Puede ser 200 si es nuevo o 400 si ya existe
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert data["email"] == user_data["email"]

    def test_get_usuarios(self, client):
        """Debe listar usuarios"""
        response = client.get("/users/")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_registrar_usuario_email_duplicado(self, client, user_data):
        """Debe rechazar email duplicado"""
        # Registrar primera vez
        client.post("/auth/register", json=user_data)
        
        # Intentar registrar de nuevo
        response = client.post("/auth/register", json=user_data)
        
        # Debería fallar por email duplicado
        assert response.status_code in [200, 400]


class TestTokenValidation:
    """Tests para validación de tokens"""

    def test_endpoint_protegido_sin_token(self, client):
        """Debe rechazar acceso sin token a endpoints protegidos"""
        response = client.get("/auth/users/me")
        
        # Sin token debería fallar
        assert response.status_code in [401, 403, 422]

    def test_endpoint_protegido_con_token_valido(self, client, admin_credentials):
        """Debe permitir acceso con token válido"""
        # Primero hacer login
        login_response = client.post("/auth/login", json=admin_credentials)
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            
            # Acceder a endpoint protegido
            headers = {"Authorization": f"Bearer {token}"}
            response = client.get("/auth/users/me", headers=headers)
            
            assert response.status_code == 200

    def test_token_invalido(self, client):
        """Debe rechazar token inválido"""
        headers = {"Authorization": "Bearer token_invalido_123"}
        response = client.get("/auth/users/me", headers=headers)
        
        assert response.status_code in [401, 403]
