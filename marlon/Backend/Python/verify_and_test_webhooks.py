#!/usr/bin/env python
"""
SOLUCIÓN DEFINITIVA - VERIFICACIÓN Y PRUEBA DE WEBHOOKS
Ejecutar: python verify_and_test_webhooks.py
"""

import os
import sys
import django
import json
import requests
from datetime import datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')
django.setup()

from django.test import Client
from django.urls import reverse
from django.contrib.auth.models import User

# Colores para terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    """Imprime header formateado"""
    print(f"\n{Colors.MAGENTA}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.MAGENTA}{Colors.BOLD}║  {text:<66}  ║{Colors.END}")
    print(f"{Colors.MAGENTA}{Colors.BOLD}{'='*70}{Colors.END}\n")

def print_success(text):
    """Imprime mensaje de éxito"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    """Imprime mensaje de error"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text):
    """Imprime advertencia"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_info(text):
    """Imprime información"""
    print(f"{Colors.CYAN}ℹ {text}{Colors.END}")

def verify_django_setup():
    """Verifica que Django está configurado correctamente"""
    print_header("PASO 1: VERIFICACIÓN DE DJANGO")
    
    from django.conf import settings
    
    print_info("Django está inicializado correctamente")
    print_info(f"DEBUG: {settings.DEBUG}")
    print_info(f"Base de datos: {settings.DATABASES['default']['ENGINE']}")
    print_success("Django está listo")

def verify_urls():
    """Verifica que las URLs estén configuradas"""
    print_header("PASO 2: VERIFICACIÓN DE URLs")
    
    from django.urls import get_resolver
    
    resolver = get_resolver()
    webhook_patterns = [p for p in resolver.url_patterns if 'webhook' in str(p.pattern)]
    
    if webhook_patterns:
        print_success(f"Se encontraron {len(webhook_patterns)} patrones de webhook")
        for pattern in webhook_patterns[:10]:
            print_info(f"  - {pattern.pattern}")
    else:
        print_warning("No se encontraron patrones de webhook. Revisar urls.py")

def test_endpoints():
    """Prueba todos los endpoints de webhook"""
    print_header("PASO 3: PRUEBA DE ENDPOINTS")
    
    client = Client()
    
    endpoints = [
        {
            'name': 'Health Check',
            'method': 'GET',
            'path': '/webhooks/health/',
            'data': None
        },
        {
            'name': 'Stripe Webhook',
            'method': 'POST',
            'path': '/webhooks/payments/stripe/',
            'data': {
                'id': 'evt_test_001',
                'type': 'charge.succeeded',
                'created': int(datetime.now().timestamp()),
                'data': {
                    'object': {
                        'id': 'ch_test_001',
                        'amount': 9999,
                        'currency': 'usd',
                        'status': 'succeeded'
                    }
                }
            }
        },
        {
            'name': 'MercadoPago Webhook',
            'method': 'POST',
            'path': '/webhooks/payments/mercadopago/',
            'data': {
                'id': 'mp_test_001',
                'type': 'payment',
                'data': {
                    'id': 'payment_001',
                    'status': 'approved',
                    'amount': 99.99
                }
            }
        },
        {
            'name': 'PayU Webhook',
            'method': 'POST',
            'path': '/webhooks/payments/payu/',
            'data': {
                'id': 'payu_test_001',
                'state': 'CONFIRMED',
                'value': '99.99'
            }
        },
        {
            'name': 'Partner Webhook',
            'method': 'POST',
            'path': '/webhooks/partner/',
            'data': {
                'event': 'partner_sync',
                'timestamp': int(datetime.now().timestamp()),
                'partner_id': 'partner_001'
            }
        },
        {
            'name': 'Telegram Webhook',
            'method': 'POST',
            'path': '/webhooks/telegram/',
            'data': {
                'update_id': 123456,
                'message': {
                    'message_id': 1,
                    'text': 'Test webhook',
                    'from': {'id': 123456789}
                }
            }
        }
    ]
    
    results = []
    for endpoint in endpoints:
        try:
            if endpoint['method'] == 'GET':
                response = client.get(endpoint['path'])
            else:
                response = client.post(
                    endpoint['path'],
                    data=json.dumps(endpoint['data']),
                    content_type='application/json'
                )
            
            if response.status_code in [200, 201, 202]:
                print_success(f"{endpoint['name']} - Status {response.status_code}")
                results.append(True)
            else:
                print_error(f"{endpoint['name']} - Status {response.status_code}")
                results.append(False)
        except Exception as e:
            print_error(f"{endpoint['name']} - {str(e)}")
            results.append(False)
    
    return sum(results), len(results)

def show_summary(success, total):
    """Muestra resumen final"""
    print_header("RESUMEN FINAL")
    
    percentage = (success / total * 100) if total > 0 else 0
    
    print_info(f"Endpoints probados: {success}/{total}")
    print_info(f"Tasa de éxito: {percentage:.0f}%")
    
    if success == total:
        print_success("¡TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE!")
    elif success > 0:
        print_warning(f"Algunos endpoints no responden correctamente")
    else:
        print_error("Los endpoints no están respondiendo")
    
    return success == total

def show_instructions():
    """Muestra instrucciones de uso en Postman"""
    print_header("INSTRUCCIONES PARA POSTMAN")
    
    print(f"""
{Colors.CYAN}1. ABRIR POSTMAN
{Colors.END}   - Descarga Postman si no lo tienes
   - Abre la aplicación

{Colors.CYAN}2. IMPORTAR COLECCIÓN
{Colors.END}   - Haz clic en "Import"
   - Selecciona: Marlon_Webhooks_Postman.postman_collection.json
   - Haz clic en "Import"

{Colors.CYAN}3. CONFIGURAR BASE URL
{Colors.END}   - En la pestaña de "Variables" (arriba)
   - Base URL: localhost:8000
   - Haz clic en "Save"

{Colors.CYAN}4. PROBAR ENDPOINTS
{Colors.END}   - Expande "PAYMENT WEBHOOKS"
   - Selecciona "Stripe - Charge Succeeded"
   - Haz clic en "Send"
   - Deberías ver Status 200 OK

{Colors.CYAN}ENDPOINTS DISPONIBLES:
{Colors.END}
   ✓ POST   /webhooks/payments/stripe/
   ✓ POST   /webhooks/payments/mercadopago/
   ✓ POST   /webhooks/payments/payu/
   ✓ POST   /webhooks/partner/
   ✓ POST   /webhooks/telegram/
   ✓ GET    /webhooks/health/
   ✓ GET    /webhooks/events/

{Colors.CYAN}BASE URL DE DJANGO:
{Colors.END}   {Colors.BOLD}http://localhost:8000{Colors.END}

{Colors.CYAN}SI OBTIENES ERROR 404:
{Colors.END}   1. Verifica que Django está corriendo
   2. En terminal: python manage.py runserver
   3. Espera a que diga "Starting development server at http://127.0.0.1:8000/"
   4. Luego prueba en Postman
    """)

def main():
    """Función principal"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║       SOLUCIÓN DEFINITIVA - WEBHOOKS MARLON - VERIFICACIÓN COMPLETA      ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print(Colors.END)
    
    try:
        # Paso 1: Verificar Django
        verify_django_setup()
        
        # Paso 2: Verificar URLs
        verify_urls()
        
        # Paso 3: Probar endpoints
        success, total = test_endpoints()
        
        # Paso 4: Mostrar resumen
        all_working = show_summary(success, total)
        
        # Paso 5: Instrucciones
        show_instructions()
        
        if all_working:
            print(f"\n{Colors.GREEN}{Colors.BOLD}¡LISTO PARA ENTREGAR! 🎉{Colors.END}\n")
            sys.exit(0)
        else:
            print(f"\n{Colors.YELLOW}Algunos endpoints necesitan revisión{Colors.END}\n")
            sys.exit(1)
            
    except Exception as e:
        print_error(f"Error durante verificación: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
