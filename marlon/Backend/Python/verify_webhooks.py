#!/usr/bin/env python
"""
Script para verificar todos los endpoints de webhooks disponibles
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.urls import get_resolver
from django.urls.exceptions import Resolver404

def print_urls(urlpatterns, prefix=''):
    """Imprime todos los URLs disponibles"""
    for pattern in urlpatterns:
        if hasattr(pattern, 'url_patterns'):
            # Include pattern
            new_prefix = prefix + str(pattern.pattern)
            print_urls(pattern.url_patterns, new_prefix)
        else:
            # Regular pattern
            full_path = prefix + str(pattern.pattern)
            if 'webhook' in str(full_path).lower():
                print(f"✅ {full_path}")

print("\n" + "="*60)
print("WEBHOOKS DISPONIBLES EN DJANGO")
print("="*60 + "\n")

resolver = get_resolver()
print_urls(resolver.url_patterns)

print("\n" + "="*60)
print("Endpoints Stripe:")
print("  POST http://localhost:8000/webhooks/payments/stripe/")
print("\nEndpoints MercadoPago:")
print("  POST http://localhost:8000/webhooks/payments/mercadopago/")
print("\nEndpoints PayU:")
print("  POST http://localhost:8000/webhooks/payments/payu/")
print("\nEndpoints Partner:")
print("  POST http://localhost:8000/webhooks/partner/")
print("\nEndpoints Telegram:")
print("  POST http://localhost:8000/webhooks/telegram/")
print("\nHealth Check:")
print("  GET http://localhost:8000/webhooks/health/")
print("="*60 + "\n")
