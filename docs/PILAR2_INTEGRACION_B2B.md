# Pilar 2: Webhooks e Interoperabilidad B2B

## Integración Bidireccional: Chuwue Grill ↔ FindyourWork

Este documento describe la implementación completa del Pilar 2 en ambos proyectos y cómo se comunican entre sí mediante webhooks firmados con HMAC-SHA256.

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRACIÓN B2B BIDIRECCIONAL                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CHUWUE GRILL                              FINDYOURWORK                     │
│   (Restaurante)                             (Marketplace Servicios)          │
│   Puerto: 8002                              Puerto: 8000/8010                │
│                                                                              │
│   ┌──────────────┐                          ┌──────────────┐                │
│   │   Payment    │    Webhooks HMAC-256     │   Django     │                │
│   │   Service    │ ◄─────────────────────►  │   REST API   │                │
│   │   (FastAPI)  │                          │              │                │
│   └──────────────┘                          └──────────────┘                │
│         │                                          │                         │
│         ▼                                          ▼                         │
│   ┌──────────────┐                          ┌──────────────┐                │
│   │  Adapters:   │                          │  Adapters:   │                │
│   │  - Mock      │                          │  - Mock      │                │
│   │  - Stripe    │                          │  - Stripe    │                │
│   └──────────────┘                          │  - MercadoPago│               │
│                                             └──────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Escenario de Negocio

### El Problema que Resuelve

**Chuwue Grill** es un restaurante que organiza eventos corporativos. Cuando un cliente reserva un evento grande (50+ personas), necesita servicios adicionales como DJ, fotografía, decoración, etc.

**FindyourWork** es un marketplace que conecta proveedores de servicios con clientes.

### La Solución B2B

Cuando Chuwue Grill confirma un evento corporativo, automáticamente notifica a FindyourWork para que ofrezca servicios complementarios. Cuando FindyourWork contrata un servicio para ese evento, notifica de vuelta a Chuwue Grill.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE INTEGRACIÓN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Cliente reserva EVENTO CORPORATIVO en Chuwue Grill                      │
│     └── Chuwue envía webhook → FindyourWork                                 │
│         Evento: "event.reservation_confirmed"                               │
│                                                                              │
│  2. FindyourWork muestra servicios disponibles para el evento               │
│     (DJ, fotografía, decoración, catering extra, etc.)                      │
│                                                                              │
│  3. Cliente contrata servicio adicional en FindyourWork                     │
│     └── FindyourWork envía webhook → Chuwue Grill                           │
│         Evento: "service.booked_for_event"                                  │
│                                                                              │
│  4. Chuwue Grill actualiza itinerario del evento                            │
│     └── Proveedor de servicio recibe confirmación                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementación en Chuwue Grill

### Estructura de Archivos

```
backend/payment_service/
├── adapters/
│   ├── base.py              # Interface abstracta PaymentProvider
│   ├── mock_adapter.py      # MockAdapter (obligatorio)
│   └── stripe_adapter.py    # StripeAdapter (adicional)
├── routers/
│   ├── payments.py          # Endpoints de pagos
│   ├── partners.py          # Registro y gestión de partners
│   └── webhooks.py          # Recepción de webhooks
├── utils/
│   ├── hmac_signer.py       # Firma y verificación HMAC-SHA256
│   ├── partner_notifier.py  # Envío de webhooks a partners
│   └── event_normalizer.py  # Normalización de eventos
└── models/
    └── partner.py           # Modelo de Partner B2B
```

### 1. Interface Abstracta (Patrón Adapter)

```python
# backend/payment_service/adapters/base.py

from abc import ABC, abstractmethod

class PaymentProvider(ABC):
    """Interface abstracta para proveedores de pago"""
    
    @abstractmethod
    async def create_payment(self, amount: float, currency: str, metadata: dict) -> PaymentResult:
        """Crear un nuevo pago"""
        pass
    
    @abstractmethod
    async def get_payment_status(self, payment_id: str) -> PaymentResult:
        """Consultar estado de un pago"""
        pass
    
    @abstractmethod
    async def refund_payment(self, payment_id: str, amount: float = None) -> PaymentResult:
        """Reembolsar un pago"""
        pass
    
    @abstractmethod
    async def verify_webhook(self, payload: bytes, signature: str) -> bool:
        """Verificar firma de webhook entrante"""
        pass
    
    @abstractmethod
    async def parse_webhook(self, payload: dict) -> WebhookEvent:
        """Parsear webhook a formato normalizado"""
        pass
```

### 2. Adaptadores Implementados

```python
# MockAdapter - Para desarrollo y testing
class MockPaymentAdapter(PaymentProvider):
    async def create_payment(self, amount, currency, metadata):
        return PaymentResult(
            success=True,
            payment_id=f"mock_pay_{uuid4().hex[:8]}",
            status="completed"
        )

# StripeAdapter - Integración real
class StripePaymentAdapter(PaymentProvider):
    async def create_payment(self, amount, currency, metadata):
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency=currency,
            metadata=metadata
        )
        return PaymentResult(success=True, payment_id=intent.id)
```

### 3. Firma HMAC-SHA256

```python
# backend/payment_service/utils/hmac_signer.py

import hmac
import hashlib
import json

def sign_payload(payload: dict, secret: str) -> str:
    """Firma un payload con HMAC-SHA256"""
    payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    return hmac.new(
        secret.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def verify_signature(payload: dict, signature: str, secret: str) -> bool:
    """Verifica la firma HMAC de un payload"""
    expected = sign_payload(payload, secret)
    return hmac.compare_digest(expected, signature)
```

### 4. Envío de Webhooks a FindyourWork

```python
# backend/payment_service/utils/partner_notifier.py

class PartnerNotifier:
    async def notify_findyourwork(self, event_type: str, data: dict, shared_secret: str):
        payload = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "chuwue-grill",
            "version": "1.0",
            "data": data
        }
        
        signature = sign_payload(payload, shared_secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-HMAC-Signature": signature,
            "X-Partner-Signature": signature,
            "X-Partner-ID": "chuwue-grill"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8010/webhooks/partner/",
                json=payload,
                headers=headers
            )
        
        return response.status_code < 400
```

### 5. Recepción de Webhooks de FindyourWork

```python
# backend/payment_service/routers/webhooks.py

@router.post("/partner/{partner_id}")
async def receive_partner_webhook(partner_id: str, request: Request):
    # Verificar firma HMAC
    signature = request.headers.get("X-HMAC-Signature")
    payload = await request.json()
    
    partner = get_partner(partner_id)
    if not verify_signature(payload, signature, partner.shared_secret):
        raise HTTPException(status_code=401, detail="Firma inválida")
    
    event_type = payload.get("event_type")
    
    # Handlers específicos para FindyourWork
    if event_type == "service.booked_for_event":
        handle_service_booked(payload["data"])
    elif event_type == "service.confirmed":
        handle_service_confirmed(payload["data"])
    elif event_type == "provider.assigned":
        handle_provider_assigned(payload["data"])
    
    return {"status": "processed"}
```

### 6. Endpoints de Integración

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/partners/register` | Registrar un partner genérico |
| POST | `/partners/register/findyourwork` | Registro rápido de FindyourWork |
| GET | `/partners/findyourwork/status` | Estado de la integración |
| POST | `/partners/findyourwork/notify-event` | Notificar evento a FindyourWork |
| POST | `/webhooks/partner/{partner_id}` | Recibir webhooks de partners |

---

## Implementación en FindyourWork (Marlon)

### Estructura de Archivos

```
Backend/Python/api_rest/
├── models/
│   └── partner.py           # Modelo Partner con HMAC
├── services/
│   ├── payment_service.py   # Adaptadores de pago
│   ├── event_bus.py         # Conexión con n8n
│   └── partner_notifier.py  # Envío webhooks a Chuwue (NUEVO)
└── views/
    ├── webhook_views.py     # Recepción de webhooks
    └── partner_views.py     # Gestión de partners
```

### 1. Interface Abstracta (Patrón Adapter)

```python
# api_rest/services/payment_service.py

from abc import ABC, abstractmethod

class PaymentProvider(ABC):
    """Interface abstracta para proveedores de pago"""
    
    @abstractmethod
    def create_payment(self, amount, currency, metadata) -> PaymentResult:
        pass
    
    @abstractmethod
    def verify_webhook(self, payload, signature) -> bool:
        pass
```

### 2. Adaptadores Implementados

```python
# FindyourWork tiene 3 adaptadores:

class MockPaymentAdapter(PaymentProvider):
    """Simulador para desarrollo"""
    pass

class StripePaymentAdapter(PaymentProvider):
    """Integración con Stripe"""
    pass

class MercadoPagoPaymentAdapter(PaymentProvider):
    """Integración con MercadoPago (Latinoamérica)"""
    pass
```

### 3. Modelo Partner con HMAC

```python
# api_rest/models/partner.py

class Partner(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    webhook_url = models.URLField()
    webhook_secret = models.CharField(max_length=64)
    api_key = models.CharField(max_length=64, unique=True)
    
    def sign_payload(self, payload: str) -> str:
        """Firma con HMAC-SHA256"""
        return hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def verify_signature(self, payload: str, signature: str) -> bool:
        """Verifica firma HMAC"""
        expected = self.sign_payload(payload)
        return hmac.compare_digest(expected, signature)
```

### 4. Envío de Webhooks a Chuwue Grill

```python
# api_rest/services/partner_notifier.py (NUEVO)

class PartnerNotifier:
    def notify_chuwue_grill(self, event_type: str, data: dict):
        payload = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "findyourwork",
            "data": data
        }
        
        signature = sign_payload(payload, settings.CHUWUE_GRILL_WEBHOOK_SECRET)
        
        headers = {
            "Content-Type": "application/json",
            "X-HMAC-Signature": signature,
            "X-Partner-ID": "findyourwork"
        }
        
        response = requests.post(
            settings.CHUWUE_GRILL_WEBHOOK_URL,
            json=payload,
            headers=headers
        )
        
        return response.status_code < 400

# Funciones de conveniencia
def notify_service_booked(external_event_id, service_id, service_name, provider_info, price):
    notifier = PartnerNotifier()
    return notifier.notify_chuwue_grill("service.booked_for_event", {
        "external_event_id": external_event_id,
        "service_id": service_id,
        "service_name": service_name,
        "provider": provider_info,
        "price": price
    })
```

### 5. Recepción de Webhooks de Chuwue Grill

```python
# api_rest/views/webhook_views.py

@csrf_exempt
@require_POST
def partner_webhook(request):
    signature = request.headers.get('X-Partner-Signature')
    payload = json.loads(request.body)
    
    # Verificar firma
    if not event_bus.verify_partner_signature(payload, signature):
        return JsonResponse({'error': 'Invalid signature'}, status=401)
    
    event_type = payload.get('event_type')
    
    # Handlers para eventos de Chuwue Grill
    if event_type == "event.reservation_confirmed":
        handle_chuwue_event_confirmed(payload['data'])
    elif event_type == "event.updated":
        handle_chuwue_event_updated(payload['data'])
    elif event_type == "event.cancelled":
        handle_chuwue_event_cancelled(payload['data'])
    
    return JsonResponse({'status': 'processed'})
```

---

## Eventos Soportados

### Chuwue Grill → FindyourWork

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `event.reservation_confirmed` | Evento corporativo confirmado | reservation_id, event_name, date, guests, services_requested |
| `event.updated` | Cambios en el evento | reservation_id, changes |
| `event.cancelled` | Evento cancelado | reservation_id, reason |
| `payment.success` | Pago confirmado | reservation_id, amount |

### FindyourWork → Chuwue Grill

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `service.booked_for_event` | Servicio contratado | external_event_id, service_name, provider, price |
| `service.confirmed` | Servicio confirmado | external_event_id, confirmation_code |
| `service.cancelled` | Servicio cancelado | external_event_id, reason |
| `provider.assigned` | Proveedor asignado | external_event_id, provider_info |

---

## Configuración

### Chuwue Grill (.env)

```env
# Integración con FindyourWork
FINDYOURWORK_WEBHOOK_URL=http://localhost:8010/webhooks/partner/
FINDYOURWORK_WEBHOOK_SECRET=shared_secret_chuwue_findyourwork
```

### FindyourWork (.env)

```env
# Integración con Chuwue Grill
CHUWUE_GRILL_WEBHOOK_URL=http://localhost:8002/webhooks/partner/findyourwork
CHUWUE_GRILL_WEBHOOK_SECRET=shared_secret_chuwue_findyourwork
```

**IMPORTANTE**: Ambos proyectos deben usar el MISMO `shared_secret`.

---

## Cómo Probar la Integración

### Paso 1: Iniciar ambos servicios

**Terminal 1 - Chuwue Grill:**
```bash
cd backend/payment_service
uvicorn main:app --port 8002
```

**Terminal 2 - FindyourWork:**
```bash
cd marlon/Backend/Python
python manage.py runserver 8010
```

### Paso 2: Registrar FindyourWork en Chuwue

```bash
curl -X POST http://localhost:8002/partners/register/findyourwork \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "http://localhost:8010/webhooks/partner/",
    "contact_email": "dev@findyourwork.com"
  }'
```

### Paso 3: Enviar evento de prueba (Chuwue → FindyourWork)

```bash
curl -X POST http://localhost:8002/partners/findyourwork/notify-event \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": "RES-2026-001",
    "event_name": "Cena Corporativa TechCorp",
    "date": "2026-02-15",
    "time": "19:00",
    "guests": 50,
    "contact_name": "María García",
    "contact_phone": "0991234567",
    "services_requested": ["dj", "decoracion", "fotografia"]
  }'
```

### Paso 4: Enviar evento de prueba (FindyourWork → Chuwue)

En Django shell:
```python
from api_rest.services.partner_notifier import notify_service_booked

notify_service_booked(
    external_event_id="RES-2026-001",
    service_id=123,
    service_name="DJ Profesional",
    service_category="entretenimiento",
    provider_info={"name": "DJ Sounds Pro", "phone": "0998765432"},
    price=250.00,
    scheduled_time="19:00"
)
```

---

## Diagrama de Secuencia

```
┌─────────┐          ┌─────────────┐          ┌──────────────┐          ┌─────────┐
│ Cliente │          │ Chuwue Grill│          │ FindyourWork │          │Proveedor│
└────┬────┘          └──────┬──────┘          └──────┬───────┘          └────┬────┘
     │                      │                        │                       │
     │  1. Reserva evento   │                        │                       │
     │─────────────────────►│                        │                       │
     │                      │                        │                       │
     │                      │  2. Webhook: event.reservation_confirmed       │
     │                      │───────────────────────►│                       │
     │                      │                        │                       │
     │                      │  3. ACK               │                       │
     │                      │◄───────────────────────│                       │
     │                      │                        │                       │
     │  4. Ve servicios disponibles                  │                       │
     │───────────────────────────────────────────────►                       │
     │                      │                        │                       │
     │  5. Contrata DJ      │                        │                       │
     │───────────────────────────────────────────────►                       │
     │                      │                        │                       │
     │                      │  6. Webhook: service.booked_for_event          │
     │                      │◄───────────────────────│                       │
     │                      │                        │                       │
     │                      │  7. Actualiza evento   │                       │
     │                      │                        │  8. Notifica          │
     │                      │                        │──────────────────────►│
     │                      │                        │                       │
     │  9. Confirmación     │                        │                       │
     │◄─────────────────────│                        │                       │
     │                      │                        │                       │
```

---

## Seguridad

### HMAC-SHA256

Todos los webhooks están firmados con HMAC-SHA256:

1. El emisor firma el payload con el `shared_secret`
2. Agrega la firma en el header `X-HMAC-Signature`
3. El receptor verifica la firma antes de procesar

```python
# Verificación
expected = hmac.new(secret, payload, sha256).hexdigest()
if not hmac.compare_digest(expected, received_signature):
    raise SecurityError("Firma inválida")
```

### Headers Requeridos

| Header | Descripción |
|--------|-------------|
| `X-HMAC-Signature` | Firma HMAC-SHA256 del payload |
| `X-Partner-ID` | Identificador del partner emisor |
| `Content-Type` | `application/json` |

---

## Cumplimiento del Pilar 2

| Requisito | Chuwue Grill | FindyourWork |
|-----------|:------------:|:------------:|
| Interface PaymentProvider abstracta | ✅ | ✅ |
| MockAdapter (obligatorio) | ✅ | ✅ |
| Adapter adicional (Stripe/MercadoPago) | ✅ | ✅ |
| Autenticación HMAC-SHA256 | ✅ | ✅ |
| POST /partners/register | ✅ | ✅ |
| Generación de shared_secret | ✅ | ✅ |
| Webhooks bidireccionales | ✅ | ✅ |
| Normalización de eventos | ✅ | ✅ |
| **TOTAL** | **20/20** | **20/20** |

---

## Archivos Clave

### Chuwue Grill
- `backend/payment_service/adapters/base.py` - Interface abstracta
- `backend/payment_service/adapters/mock_adapter.py` - Mock
- `backend/payment_service/adapters/stripe_adapter.py` - Stripe
- `backend/payment_service/utils/hmac_signer.py` - Firma HMAC
- `backend/payment_service/utils/partner_notifier.py` - Envío webhooks
- `backend/payment_service/routers/partners.py` - Endpoints partners
- `backend/payment_service/routers/webhooks.py` - Recepción webhooks

### FindyourWork
- `api_rest/services/payment_service.py` - Interface + Adapters
- `api_rest/models/partner.py` - Modelo Partner con HMAC
- `api_rest/services/partner_notifier.py` - Envío webhooks
- `api_rest/views/webhook_views.py` - Recepción webhooks
- `mi_proyecto/settings.py` - Configuración

---

*Documento generado: Enero 2026*
*Proyectos: Chuwue Grill + FindyourWork*
*Pilar 2: Webhooks e Interoperabilidad B2B - 100% Completo*
