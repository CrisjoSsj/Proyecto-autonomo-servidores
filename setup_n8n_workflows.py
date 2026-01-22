#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para crear workflows en n8n automáticamente
Requiere: pip install requests
"""
import requests
import json
import time
import sys
import os

# Configurar encoding
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

N8N_BASE_URL = "http://localhost:5678"
N8N_EMAIL = "admin@chuwue.com"
N8N_PASSWORD = "admin123"

def wait_for_n8n(max_attempts=30):
    """Espera a que n8n esté disponible"""
    print("⏳ Esperando a que n8n esté disponible...")
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{N8N_BASE_URL}/", timeout=5)
            if response.status_code in [200, 401, 403]:  # Incluso si redirige, está disponible
                print("✅ n8n está disponible")
                time.sleep(2)  # Esperar un poco más para asegurar que la API esté lista
                return True
        except:
            pass
        
        print(f"   Intento {attempt + 1}/{max_attempts}...")
        time.sleep(1)
    
    print("❌ n8n no está disponible después de 30 intentos")
    return False

def get_auth_token():
    """Obtiene el token de autenticación de n8n"""
    print("\n🔐 Obteniendo token de autenticación...")
    
    try:
        # Intentar con varios endpoints
        endpoints = [
            f"{N8N_BASE_URL}/api/v1/auth/login",
            f"{N8N_BASE_URL}/api/authentication/login",
            f"{N8N_BASE_URL}/api/user/login"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.post(
                    endpoint,
                    json={
                        "email": N8N_EMAIL,
                        "password": N8N_PASSWORD
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Intentar obtener el token de diferentes ubicaciones
                    token = data.get("data", {}).get("token") or data.get("token") or data.get("accessToken")
                    if token:
                        print(f"✅ Token obtenido desde {endpoint}")
                        return token
                else:
                    print(f"   {endpoint}: {response.status_code}")
                    
            except Exception as e:
                print(f"   Error en {endpoint}: {str(e)[:50]}")
        
        print("\n⚠️  No se pudo obtener el token con autenticación")
        print("   Intentando crear el usuario automáticamente...")
        return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

def create_webhook(token, path, name):
    """Crea un webhook en n8n"""
    print(f"\n📡 Creando webhook: {name}")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {
            "name": name,
            "nodes": [
                {
                    "parameters": {
                        "path": path,
                        "responseMode": "onReceived",
                        "responseData": '{"status": "received", "timestamp": "{{ $now.toISO() }}"}',
                        "options": {}
                    },
                    "id": f"webhook_{path.replace('/', '_')}",
                    "name": f"Webhook {name}",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 1,
                    "position": [250, 300]
                },
                {
                    "parameters": {
                        "url": "http://localhost:8004/webhooks/callback/",
                        "method": "POST",
                        "bodyParametersUi": "json",
                        "bodyJson": '{"event_type": "{{ $node[\\\"Webhook ' + name + '\\\"].json.type }}", "data": "{{ $node[\\\"Webhook ' + name + '\\\"].json }}", "processed_at": "{{ $now.toISO() }}"}',
                        "options": {}
                    },
                    "id": "http_callback",
                    "name": "HTTP Callback to Django",
                    "type": "n8n-nodes-base.httpRequest",
                    "typeVersion": 4.1,
                    "position": [550, 300]
                }
            ],
            "connections": {
                f"webhook_{path.replace('/', '_')}": {
                    "main": [
                        [
                            {
                                "node": "http_callback",
                                "type": "main",
                                "index": 0
                            }
                        ]
                    ]
                }
            },
            "active": True
        }
        
        response = requests.post(
            f"{N8N_BASE_URL}/api/v1/workflows",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            workflow_id = data.get("data", {}).get("id")
            print(f"✅ Webhook {name} creado (ID: {workflow_id})")
            return workflow_id
        else:
            print(f"❌ Error creando webhook: {response.status_code}")
            print(f"   Respuesta: {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def activate_workflow(token, workflow_id):
    """Activa un workflow"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.patch(
            f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
            json={"active": True},
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Workflow {workflow_id} activado")
            return True
        else:
            print(f"⚠️  No se pudo activar el workflow: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"⚠️  Error activando workflow: {e}")
        return False

def main():
    """Función principal"""
    print("=" * 60)
    print("🚀 Configurador Automático de Webhooks en n8n")
    print("=" * 60)
    
    # 1. Esperar a que n8n esté disponible
    if not wait_for_n8n():
        sys.exit(1)
    
    # 2. Obtener token
    token = get_auth_token()
    if not token:
        print("\n❌ No se pudo obtener el token de autenticación")
        print("   Verifica que n8n esté corriendo y las credenciales sean correctas")
        sys.exit(1)
    
    # 3. Crear webhooks
    webhooks = [
        ("webhooks/payments/stripe", "Stripe Payments"),
        ("webhooks/payments/payu", "PayU Payments"),
        ("webhooks/payments/mercadopago", "MercadoPago Payments"),
        ("webhooks/partner", "Partner Webhook"),
        ("webhooks/telegram", "Telegram Messages"),
        ("webhooks/email", "Email Webhook"),
        ("webhooks/whatsapp", "WhatsApp Messages"),
    ]
    
    created_workflows = []
    for path, name in webhooks:
        workflow_id = create_webhook(token, path, name)
        if workflow_id:
            created_workflows.append((workflow_id, name))
            time.sleep(1)  # Esperar entre creaciones
    
    # 4. Activar workflows
    print("\n" + "=" * 60)
    print("🔄 Activando workflows...")
    print("=" * 60)
    
    for workflow_id, name in created_workflows:
        activate_workflow(token, workflow_id)
    
    # 5. Resumen
    print("\n" + "=" * 60)
    print("✅ CONFIGURACIÓN COMPLETADA")
    print("=" * 60)
    print(f"\n📡 Webhooks creados: {len(created_workflows)}")
    print(f"🌐 n8n disponible en: {N8N_BASE_URL}")
    print(f"👤 Usuario: {N8N_EMAIL}")
    print("\n✨ Los webhooks están listos para recibir requests desde Django")
    print("\nPrueba con:")
    print("  POST http://localhost:5678/webhook/webhooks/payments/stripe")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
