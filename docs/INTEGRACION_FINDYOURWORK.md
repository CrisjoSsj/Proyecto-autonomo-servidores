# Integración B2B: Chuwue Grill ↔ FindyourWork

## Descripción

Esta documentación describe la integración bidireccional entre:
- **Chuwue Grill**: Sistema de restaurante (reservas, menú, eventos)
- **FindyourWork**: Marketplace de servicios profesionales

## Escenario de Negocio

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE INTEGRACIÓN                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Cliente reserva EVENTO CORPORATIVO en Chuwue Grill                  │
│     └── Chuwue envía webhook → FindyourWork                             │
│         Evento: "event.reservation_confirmed"                           │
│                                                                          │
│  2. FindyourWork muestra servicios disponibles para el evento           │
│     (DJ, fotografía, decoración, catering extra, etc.)                  │
│                                                                          │
│  3. Cliente contrata servicio adicional en FindyourWork                 │
│     └── FindyourWork envía webhook → Chuwue Grill                       │
│         Evento: "service.booked_for_event"                              │
│                                                                          │
│  4. Chuwue Grill actualiza itinerario del evento                        │
│     └── Chuwue envía webhook → FindyourWork                             │
│         Evento: "event.updated"                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Configuración

### Paso 1: Chuwue Grill registra a FindyourWork como Partner

**Opción A: Registro Rápido (Recomendado)**
```bash
# Endpoint especializado para FindyourWork
POST http://localhost:8002/partners/register/findyourwork
Content-Type: application/json

{
  "webhook_url": "http://localhost:8000/webhooks/partner/",
  "contact_email": "dev@findyourwork.com"
}
```

**Opción B: Registro Genérico**
```bash
POST http://localhost:8002/partners/register
Content-Type: application/json

{
  "partner_name": "FindyourWork",
  "webhook_url": "http://localhost:8000/webhooks/partner/",
  "events": [
    "event.reservation_confirmed",
    "event.updated",
    "event.cancelled",
    "payment.success"
  ],
  "contact_email": "dev@findyourwork.com"
}
```

**Respuesta:**
```json
{
  "partner_id": "partner_findyourwork",
  "partner_name": "FindyourWork",
  "shared_secret": "whsec_abc123...",
  "status": "active"
}
```

### Verificar Estado de Integración

```bash
GET http://localhost:8002/partners/findyourwork/status
```

**Respuesta:**
```json
{
  "registered": true,
  "partner_id": "partner_findyourwork",
  "is_active": true,
  "webhook_url": "http://localhost:8000/webhooks/partner/",
  "subscribed_events": ["event.reservation_confirmed", "event.updated", "event.cancelled", "payment.success"],
  "stats": {
    "webhooks_sent": 15,
    "webhooks_failed": 0,
    "last_webhook": "2026-01-19T10:30:00Z"
  }
}
```

### Paso 2: FindyourWork registra a Chuwue Grill como Partner

```bash
# Desde FindyourWork (Django)
# Crear Partner en Django Admin o via API

# O ejecutar en Django shell:
python manage.py shell
```

```python
from api_rest.models.partner import Partner

partner = Partner.objects.create(
    name="Chuwue Grill",
    code="chuwue-grill",
    webhook_url="http://localhost:8002/webhooks/partner/chuwue-grill",
    description="Restaurante - Integración de eventos corporativos",
    contact_email="dev@chuwuegrill.com"
)
print(f"API Key: {partner.api_key}")
print(f"Webhook Secret: {partner.webhook_secret}")
```

---

## Eventos Bidireccionales

### Eventos que envía Chuwue Grill → FindyourWork

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `event.reservation_confirmed` | Evento corporativo confirmado | Al confirmar reserva de evento grande |
| `event.updated` | Evento actualizado | Cambio de fecha/hora/asistentes |
| `event.cancelled` | Evento cancelado | Cancelación del evento |
| `payment.success` | Pago confirmado | Pago del evento procesado |

**Payload de ejemplo:**

```json
{
  "event_type": "event.reservation_confirmed",
  "timestamp": "2026-01-19T15:30:00Z",
  "data": {
    "reservation_id": "RES-2026-001",
    "event_name": "Evento Corporativo TechCorp",
    "date": "2026-02-15",
    "time": "19:00",
    "guests": 50,
    "contact_name": "María García",
    "contact_phone": "0991234567",
    "contact_email": "maria@techcorp.com",
    "budget_range": "1000-2000",
    "notes": "Necesitan DJ y decoración",
    "services_requested": ["dj", "decoracion", "fotografia"]
  }
}
```

### Eventos que envía FindyourWork → Chuwue Grill

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `service.booked_for_event` | Servicio contratado para evento | Proveedor acepta servicio |
| `service.confirmed` | Servicio confirmado | Pago del servicio procesado |
| `service.cancelled` | Servicio cancelado | Proveedor cancela |
| `provider.assigned` | Proveedor asignado | Asignación de proveedor |

**Payload de ejemplo:**

```json
{
  "event_type": "service.booked_for_event",
  "timestamp": "2026-01-19T16:00:00Z",
  "data": {
    "external_event_id": "RES-2026-001",
    "service_id": 123,
    "service_name": "DJ Profesional",
    "service_category": "entretenimiento",
    "provider": {
      "id": 456,
      "name": "DJ Sounds Pro",
      "rating": 4.8,
      "phone": "0998765432"
    },
    "price": 250.00,
    "currency": "USD",
    "scheduled_time": "19:00",
    "duration_hours": 4,
    "status": "confirmed"
  }
}
```

---

## Uso de la API

### Notificar Evento a FindyourWork

```bash
POST http://localhost:8002/partners/findyourwork/notify-event
Content-Type: application/json

{
  "reservation_id": "RES-2026-001",
  "event_name": "Cena Corporativa TechCorp",
  "date": "2026-02-15",
  "time": "19:00",
  "guests": 50,
  "contact_name": "María García",
  "contact_phone": "0991234567",
  "contact_email": "maria@techcorp.com",
  "services_requested": ["dj", "decoracion", "fotografia"],
  "notes": "Celebración de aniversario"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Webhook enviado a FindyourWork",
  "event_type": "event.reservation_confirmed",
  "reservation_id": "RES-2026-001",
  "webhook_url": "http://localhost:8000/webhooks/partner/"
}
```

---

## Implementación en Chuwue Grill

### Enviar webhook a FindyourWork (Código)

```python
# backend/payment_service/utils/partner_notifier.py

import httpx
import json
from datetime import datetime, timezone
from .hmac_signer import sign_payload

async def notify_findyourwork(event_type: str, data: dict, partner_secret: str):
    """
    Envía webhook a FindyourWork
    """
    payload = {
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "chuwue-grill",
        "data": data
    }
    
    signature = sign_payload(payload, partner_secret)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "http://localhost:8000/webhooks/partner/",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-Partner-Signature": signature,
                "X-Partner-ID": "chuwue-grill"
            }
        )
    
    return response.status_code < 400
```

### Recibir webhook de FindyourWork

Agregar en `backend/payment_service/routers/webhooks.py`:

```python
@router.post("/webhooks/partner/findyourwork")
async def receive_findyourwork_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Recibe webhooks de FindyourWork
    """
    # Verificar firma HMAC
    signature = request.headers.get("X-Partner-Signature", "")
    body = await request.body()
    
    partner = db.query(Partner).filter(
        Partner.partner_name == "FindyourWork"
    ).first()
    
    if not partner or not verify_signature(body, signature, partner.shared_secret):
        raise HTTPException(401, "Firma inválida")
    
    payload = await request.json()
    event_type = payload.get("event_type")
    data = payload.get("data", {})
    
    # Procesar según tipo de evento
    if event_type == "service.booked_for_event":
        # Actualizar reserva con servicio adicional
        reservation_id = data.get("external_event_id")
        service_info = {
            "name": data.get("service_name"),
            "provider": data.get("provider", {}).get("name"),
            "price": data.get("price"),
            "time": data.get("scheduled_time")
        }
        # TODO: Actualizar reserva en BD
        logger.info(f"Servicio agregado a reserva {reservation_id}: {service_info}")
    
    return {"status": "ack", "event_type": event_type}
```

---

## Implementación en FindyourWork

### Recibir webhook de Chuwue Grill

Ya implementado en `marlon/Backend/Python/api_rest/views/webhook_views.py`:

```python
# El endpoint /webhooks/partner/ ya procesa webhooks con HMAC
# Solo necesita agregar lógica específica para Chuwue Grill

# En partner_webhook():
if event_type == "event.reservation_confirmed":
    # Mostrar servicios disponibles para el evento
    event_data = payload.get("data", {})
    services_requested = event_data.get("services_requested", [])
    
    # Buscar servicios disponibles
    available_services = Servicio.objects.filter(
        categoria__nombre__in=services_requested,
        disponible=True
    )
    
    # Notificar a proveedores
    for service in available_services:
        notify_provider(service.proveedor, event_data)
```

### Enviar webhook a Chuwue Grill

```python
# marlon/Backend/Python/api_rest/services/webhook_sender.py

import requests
import hmac
import hashlib
import json
from datetime import datetime

def send_to_chuwue_grill(event_type: str, data: dict):
    """
    Envía webhook a Chuwue Grill
    """
    from api_rest.models.partner import Partner
    
    partner = Partner.objects.filter(code="chuwue-grill").first()
    if not partner:
        return False
    
    payload = {
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "findyourwork",
        "data": data
    }
    
    # Firmar payload
    payload_str = json.dumps(payload, sort_keys=True)
    signature = hmac.new(
        partner.webhook_secret.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()
    
    try:
        response = requests.post(
            partner.webhook_url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-HMAC-Signature": signature,
                "X-Partner-ID": "findyourwork"
            },
            timeout=30
        )
        return response.status_code < 400
    except Exception as e:
        print(f"Error enviando webhook: {e}")
        return False
```

---

## Pruebas de Integración

### Test 1: Chuwue Grill → FindyourWork

```bash
# 1. Levantar ambos servicios
# Terminal 1: Chuwue Grill Payment Service
cd backend/payment_service && python main.py

# Terminal 2: FindyourWork Django
cd marlon/Backend/Python && python manage.py runserver

# 2. Enviar webhook de prueba desde Chuwue Grill
curl -X POST http://localhost:8002/partners/findyourwork/send-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "event.reservation_confirmed",
    "data": {
      "reservation_id": "RES-TEST-001",
      "event_name": "Test Event",
      "date": "2026-02-15",
      "guests": 30
    }
  }'
```

### Test 2: FindyourWork → Chuwue Grill

```bash
# Enviar webhook de prueba desde FindyourWork
curl -X POST http://localhost:8000/webhooks/partner/ \
  -H "Content-Type: application/json" \
  -H "X-Partner-ID: findyourwork" \
  -H "X-Partner-Signature: test" \
  -d '{
    "event_type": "service.booked_for_event",
    "data": {
      "external_event_id": "RES-TEST-001",
      "service_name": "DJ Test",
      "price": 150
    }
  }'
```

---

## Configuración de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Chuwue Grill - Payment Service | 8002 | `http://localhost:8002` |
| Chuwue Grill - Core API | 8000 | `http://localhost:8000` (conflicto con Django) |
| FindyourWork - Django | 8000 | `http://localhost:8000` |
| FindyourWork - WebSocket | 4000 | `http://localhost:4000` |

**Nota**: Para evitar conflicto de puertos, ejecutar FindyourWork Django en puerto diferente:

```bash
cd marlon/Backend/Python
python manage.py runserver 8010
```

Y actualizar `webhook_url` a `http://localhost:8010/webhooks/partner/`

---

## Resumen

La integración está lista para funcionar. Ambos proyectos tienen:

- ✅ Modelo Partner con HMAC
- ✅ Endpoints de webhooks
- ✅ Verificación de firma
- ✅ Eventos compatibles
- ✅ n8n workflows para orquestación

Solo falta:
1. Registrar cada proyecto como partner del otro
2. Intercambiar shared_secrets
3. Probar la comunicación bidireccional

---

*Documentación generada: Enero 2026*
