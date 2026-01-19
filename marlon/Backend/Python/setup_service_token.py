#!/usr/bin/env python
"""
Script de configuración para generar el token de servicio para la integración
entre auth-service (NestJS) y Django.

Este script debe ejecutarse después de:
1. Crear la base de datos de Django (python manage.py migrate)
2. Antes de iniciar el auth-service

El token generado debe copiarse al archivo Backend/auth-service/.env
en la variable DJANGO_SERVICE_TOKEN
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')

# Añadir el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token


def setup_service_token():
    """Crea o recupera el token de servicio para auth-service."""
    
    print("=" * 60)
    print("🔧 Configuración de Token de Servicio para Auth-Service")
    print("=" * 60)
    
    # Crear o recuperar usuario de servicio
    user, created = User.objects.get_or_create(
        username='auth_service',
        defaults={
            'is_staff': True,
            'is_superuser': True,
            'email': 'auth_service@internal.local',
            'first_name': 'Auth',
            'last_name': 'Service'
        }
    )
    
    if created:
        print("✅ Usuario de servicio 'auth_service' creado")
    else:
        print("ℹ️  Usuario de servicio 'auth_service' ya existe")
    
    # Crear o recuperar token
    token, token_created = Token.objects.get_or_create(user=user)
    
    if token_created:
        print("✅ Token de servicio generado")
    else:
        print("ℹ️  Token de servicio ya existe")
    
    print("\n" + "=" * 60)
    print("📋 INSTRUCCIONES DE CONFIGURACIÓN")
    print("=" * 60)
    print("\n1. Copia el siguiente token:")
    print(f"\n   DJANGO_SERVICE_TOKEN={token.key}\n")
    print("2. Pégalo en el archivo: Backend/auth-service/.env")
    print("\n3. Reinicia el auth-service para aplicar los cambios:")
    print("   cd Backend/auth-service && npm run start:dev")
    print("\n" + "=" * 60)
    
    # También intentar actualizar el .env automáticamente
    env_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        '..', 'auth-service', '.env'
    )
    
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Buscar y reemplazar el token
            import re
            if 'DJANGO_SERVICE_TOKEN=' in content:
                new_content = re.sub(
                    r'DJANGO_SERVICE_TOKEN=.*',
                    f'DJANGO_SERVICE_TOKEN={token.key}',
                    content
                )
                
                with open(env_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print("✅ Token actualizado automáticamente en Backend/auth-service/.env")
            else:
                # Agregar al final
                with open(env_path, 'a', encoding='utf-8') as f:
                    f.write(f"\nDJANGO_SERVICE_TOKEN={token.key}\n")
                print("✅ Token agregado automáticamente a Backend/auth-service/.env")
                
        except Exception as e:
            print(f"⚠️  No se pudo actualizar .env automáticamente: {e}")
            print("   Por favor, actualiza el archivo manualmente.")
    else:
        print(f"⚠️  No se encontró el archivo .env en: {env_path}")
        print("   Por favor, crea el archivo y agrega el token manualmente.")
    
    print("\n" + "=" * 60)
    print("🎉 ¡Configuración completada!")
    print("=" * 60)
    
    return token.key


if __name__ == '__main__':
    setup_service_token()
