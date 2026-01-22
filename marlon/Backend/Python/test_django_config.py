#!/usr/bin/env python
"""
Test de configuración de Django
Ejecutar: python test_django_config.py
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')

try:
    django.setup()
    print("✓ Django inicializado correctamente")
    
    from django.conf import settings
    print(f"✓ Base de datos: {settings.DATABASES['default']['ENGINE']}")
    
    from django.urls import get_resolver
    resolver = get_resolver()
    
    # Contar endpoints
    all_patterns = str(resolver.url_patterns)
    webhook_count = all_patterns.count('webhook')
    
    print(f"✓ Se encontraron endpoints webhook")
    print(f"✓ Total de patrones URL: {len(resolver.url_patterns)}")
    
    # Verificar apps
    if 'api_rest' in settings.INSTALLED_APPS:
        print("✓ App 'api_rest' instalada")
    
    print("\n✅ CONFIGURACIÓN VÁLIDA - LISTO PARA EJECUTAR")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
