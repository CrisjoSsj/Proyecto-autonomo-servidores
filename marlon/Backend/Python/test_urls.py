#!/usr/bin/env python
"""
Script para verificar todas las rutas de webhooks registradas en Django
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')
django.setup()

from django.urls import get_resolver

resolver = get_resolver()
print("\n✅ TODAS LAS RUTAS REGISTRADAS:\n")

for i, pattern in enumerate(resolver.url_patterns):
    print(f"{i}. {pattern.pattern}")

print("\n" + "="*70)
print("🔍 BUSCANDO RUTAS DE WEBHOOKS:\n")

webhook_pattern = None
for pattern in resolver.url_patterns:
    if 'webhooks' in str(pattern.pattern):
        webhook_pattern = pattern
        print(f"✅ Encontrado: {pattern.pattern}")
        break

if webhook_pattern and hasattr(webhook_pattern, 'url_patterns'):
    print(f"\n📋 Subrutas de webhooks:\n")
    for i, sub_pattern in enumerate(webhook_pattern.url_patterns):
        print(f"   {i}. {sub_pattern.pattern}")
else:
    print("\n⚠️  No se encontraron subrutas de webhooks")
