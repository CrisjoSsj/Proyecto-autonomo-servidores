#!/usr/bin/env python3
"""
Script para iniciar Django rápidamente resolviendo problemas de migraciones
"""

import os
import sys
import django
from django.core.management import call_command
from django.db import connection
from pathlib import Path

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')

def clean_migration_table():
    """Limpia los registros de migraciones problemáticas de la BD"""
    try:
        with connection.cursor() as cursor:
            # Obtener todas las migraciones aplicadas
            cursor.execute("SELECT * FROM django_migrations WHERE app='api_rest' ORDER BY id DESC")
            migrations = cursor.fetchall()
            
            # Mostrar estado actual
            print(f"Migraciones en BD: {len(migrations)}")
            for mig in migrations[:5]:
                print(f"  - {mig}")
                
    except Exception as e:
        print(f"No se pudo leer tabla de migraciones: {e}")


def setup_database():
    """Inicializa la base de datos"""
    django.setup()
    
    print("📦 Aplicando migraciones...")
    try:
        call_command('migrate', verbosity=2)
        print("✅ Migraciones aplicadas exitosamente")
        return True
    except Exception as e:
        print(f"❌ Error en migraciones: {e}")
        print("\nIntentando con estrategia alternativa...")
        
        # Intentar aplicar migraciones hasta donde se pueda
        try:
            call_command('migrate', 'contenttypes')
            call_command('migrate', 'auth')
            call_command('migrate', 'admin')
            call_command('migrate', 'sessions')
            call_command('migrate', 'api_rest', '--fake-initial')
            print("✅ Migraciones alternativas aplicadas")
            return True
        except Exception as e2:
            print(f"❌ Estrategia alternativa también falló: {e2}")
            return False


if __name__ == '__main__':
    print("=" * 60)
    print("Django Setup - Chuwue Grill Restaurant API")
    print("=" * 60)
    
    # Verificar base de datos
    db_path = Path('db.sqlite3')
    if not db_path.exists():
        print("\n📄 Base de datos no encontrada, creando...")
    else:
        print(f"\n📄 Base de datos encontrada: {db_path.stat().st_size} bytes")
    
    # Inicializar
    if setup_database():
        print("\n✅ Base de datos lista")
        print("\nEjecutando populate_menu.py...")
        os.system('python populate_menu.py')
    else:
        print("\n❌ No se pudo inicializar la base de datos")
        sys.exit(1)
