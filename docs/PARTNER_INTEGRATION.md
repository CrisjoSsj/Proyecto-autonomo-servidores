# Guía de Integración para Partners B2B

## Chuwue Grill - Sistema de Webhooks Bidireccionales

Esta guía explica cómo integrar tu sistema con Chuwue Grill mediante webhooks.

---

## 1. Registro de Partner

### Endpoint

```
POST http://localhost:8002/partners/register
Content-Type: application/json
```

### Payload

```json
{
  "partner_name": "Grupo-Tours",
  "webhook_url": "https://tu-servidor.com/webhooks/chuwue",
  "events": ["reservation.confirmed", "payment.success", "table.assigned"],
  "contact_email": "dev@tugrupo.com"
}
```

### Respuesta

```json
{
  "partner_id": "partner_abc123def456",
  "partner_name": "Grupo-Tours",
  "webhook_url": "https://tu-servidor.com/webhooks/chuwue",
  "subscribed_events": ["reservation.confirmed", "payment.success", "table.assigned"],
  "shared_secret": "whsec_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456",
  "status": "active",
  "created_at": "2026-01-09T10:30:00Z"
}
```

> ⚠️ **IMPORTANTE**: Guarda el `shared_secret` de forma segura. Solo se muestra una vez.

---

## 2. Recibir Webhooks

### Formato de Evento

Cuando ocurre un evento, enviaremos un POST a tu `webhook_url`:

```json
{
  "event_type": "reservation.confirmed",
  "timestamp": "2026-01-09T15:45:00Z",
  "data": {
    "reservation_id": "RES123456",
    "customer_name": "Juan Pérez",
    "date": "2026-01-15",
    "time": "19:00",
    "guests": 4,
    "table": "Mesa 5",
    "notes": "Cumpleaños"
  }
}
```

### Headers

```
Content-Type: application/json
X-HMAC-Signature: abc123def456...
X-Webhook-Source: chuwue-grill
```

---

## 3. Verificación HMAC-SHA256

Todos los webhooks incluyen una firma HMAC en el header `X-HMAC-Signature`.

### Algoritmo de Verificación

```python
import hmac
import hashlib
import json

def verify_webhook(payload_bytes, signature, shared_secret):
    """Verifica la firma HMAC de un webhook"""
    expected = hmac.new(
        shared_secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)

# Uso
payload = request.body  # bytes
signature = request.headers['X-HMAC-Signature']
secret = "whsec_tu_shared_secret"

if verify_webhook(payload, signature, secret):
    # Procesar evento
    pass
else:
    # Rechazar - firma inválida
    return 401
```

### JavaScript

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## 4. Eventos Disponibles

### Eventos que Emitimos

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `reservation.confirmed` | Reserva confirmada | reservation_id, customer, date, guests |
| `reservation.cancelled` | Reserva cancelada | reservation_id, reason |
| `payment.success` | Pago completado | payment_id, amount, currency |
| `payment.failed` | Pago fallido | payment_id, error |
| `table.assigned` | Mesa asignada | reservation_id, table_number |
| `order.created` | Pedido creado | order_id, items, total |

### Eventos que Recibimos

| Evento | Descripción | Datos Esperados |
|--------|-------------|-----------------|
| `tour.purchased` | Tour comprado | tour_id, customer, date |
| `service.activated` | Servicio activado | service_id, details |
| `booking.confirmed` | Reserva partner | booking_id, customer |

---

## 5. Enviar Webhooks a Chuwue Grill

### Endpoint

```
POST http://localhost:8002/webhooks/partner/{tu_partner_id}
Content-Type: application/json
X-HMAC-Signature: {firma_hmac}
```

### Generar Firma

```python
import hmac
import hashlib
import json

payload = {
    "event_type": "tour.purchased",
    "timestamp": "2026-01-09T16:00:00Z",
    "data": {
        "tour_id": "TOUR123",
        "customer_name": "María García",
        "date": "2026-01-20"
    }
}

signature = hmac.new(
    shared_secret.encode(),
    json.dumps(payload, separators=(',', ':')).encode(),
    hashlib.sha256
).hexdigest()

# Enviar con header X-HMAC-Signature: {signature}
```

---

## 6. Respuestas Esperadas

### Webhook Exitoso

```json
{
  "status": "ok",
  "message": "Evento procesado",
  "event_type": "tour.purchased",
  "result": {
    "action": "tour_linked",
    "id": "TOUR123"
  }
}
```

### Error de Firma

```json
{
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Firma HMAC inválida",
  "details": [{"code": "PARTNER_HMAC_INVALID", "message": "La firma no coincide"}]
}
```

---

## 7. Buenas Prácticas

1. **Verificar SIEMPRE** la firma HMAC antes de procesar
2. **Responder rápido** (< 5 segundos) con status 200
3. **Idempotencia**: Procesar el mismo evento múltiples veces sin efectos duplicados
4. **Reintentos**: Configurar reintentos con backoff exponencial
5. **Logging**: Registrar todos los webhooks para debugging

---

## 8. Testing

### Endpoint de Prueba

```
POST http://localhost:8002/partners/{partner_id}/send-webhook
Content-Type: application/json

{
  "event_type": "test.ping",
  "data": {
    "message": "Test webhook",
    "timestamp": "2026-01-09T10:00:00Z"
  }
}
```

---

## 9. Contacto

- **Email**: dev@chuwuegrill.com
- **Documentación API**: http://localhost:8002/docs

---

*Última actualización: Enero 2026*
