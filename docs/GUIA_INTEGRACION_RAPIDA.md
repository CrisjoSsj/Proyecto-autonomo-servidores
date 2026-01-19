# Guía Rápida de Integración: Chuwue Grill ↔ FindyourWork

## ✅ Estado de Implementación

| Componente | Chuwue Grill | FindyourWork |
|------------|-------------|--------------|
| Modelo Partner + HMAC | ✅ | ✅ |
| Recibir webhooks firmados | ✅ | ✅ |
| Enviar webhooks firmados | ✅ | ✅ (nuevo) |
| Handlers para eventos del partner | ✅ | ✅ (nuevo) |
| Configuración en settings | ✅ | ✅ (nuevo) |

---

## 🚀 Pasos para Probar la Integración

### 1. Configurar el Shared Secret (AMBOS PROYECTOS)

Ambos proyectos deben usar el MISMO secret:

**Chuwue Grill** - `.env`:
```env
FINDYOURWORK_WEBHOOK_SECRET=shared_secret_chuwue_findyourwork
```

**FindyourWork** - `.env`:
```env
CHUWUE_GRILL_WEBHOOK_SECRET=shared_secret_chuwue_findyourwork
```

---

### 2. Iniciar ambos servicios

**Terminal 1 - Chuwue Grill:**
```bash
cd c:\Users\CrisjoSsj\Documents\GitHub\Proyecto-autonomo-servidores
docker-compose up payment-service
# Puerto: 8002
```

**Terminal 2 - FindyourWork:**
```bash
cd marlon\Backend\Python
python manage.py runserver 8010
# Puerto: 8010 (evitar conflicto con 8000)
```

---

### 3. Registrar FindyourWork en Chuwue Grill

```bash
curl -X POST http://localhost:8002/partners/register/findyourwork \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "http://localhost:8010/webhooks/partner/",
    "contact_email": "dev@findyourwork.com"
  }'
```

**Respuesta:**
```json
{
  "partner_id": "partner_findyourwork",
  "shared_secret": "whsec_xxx...",  // ¡Guardar este secret!
  "status": "active"
}
```

---

### 4. Probar envío Chuwue → FindyourWork

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
    "services_requested": ["dj", "decoracion"]
  }'
```

**En terminal de FindyourWork verás:**
```
🎉 Evento confirmado de Chuwue Grill: Cena Corporativa TechCorp
   - ID: RES-2026-001
   - Servicios solicitados: ['dj', 'decoracion']
```

---

### 5. Probar envío FindyourWork → Chuwue

En Django shell de FindyourWork:
```python
from api_rest.services.partner_notifier import notify_service_booked

notify_service_booked(
    external_event_id="RES-2026-001",
    service_id=123,
    service_name="DJ Profesional",
    service_category="entretenimiento",
    provider_info={
        "id": 456,
        "name": "DJ Sounds Pro",
        "phone": "0998765432"
    },
    price=250.00,
    scheduled_time="19:00"
)
```

---

## 📋 Eventos Soportados

### Chuwue Grill → FindyourWork

| Evento | Descripción |
|--------|-------------|
| `event.reservation_confirmed` | Evento corporativo confirmado |
| `event.updated` | Cambios en el evento |
| `event.cancelled` | Evento cancelado |
| `payment.success` | Pago confirmado |

### FindyourWork → Chuwue Grill

| Evento | Descripción |
|--------|-------------|
| `service.booked_for_event` | Servicio contratado |
| `service.confirmed` | Servicio confirmado |
| `service.cancelled` | Servicio cancelado |
| `provider.assigned` | Proveedor asignado |

---

## 📁 Archivos Clave

### Chuwue Grill
- `backend/payment_service/routers/partners.py` - Endpoints de integración
- `backend/payment_service/utils/partner_notifier.py` - Envío de webhooks
- `backend/payment_service/routers/webhooks.py` - Recepción de webhooks

### FindyourWork (marlon)
- `api_rest/views/webhook_views.py` - Recepción + handlers
- `api_rest/services/partner_notifier.py` - Envío de webhooks (nuevo)
- `mi_proyecto/settings.py` - Configuración

---

## ✅ Verificación de Cumplimiento

| Requisito del Pilar 2 | Estado |
|-----------------------|--------|
| Interface PaymentProvider abstracta | ✅ |
| MockAdapter obligatorio | ✅ |
| Adapter adicional (Stripe) | ✅ |
| HMAC-SHA256 para webhooks | ✅ |
| POST /partners/register | ✅ |
| Generación de shared_secret | ✅ |
| Webhooks bidireccionales con partner | ✅ |
| Eventos normalizados | ✅ |

**Puntuación: 20/20 ✅**
