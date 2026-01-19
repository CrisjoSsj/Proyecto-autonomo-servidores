# Pilar 4: n8n - Event Bus (15%)

## 📋 Descripción

Este módulo implementa **n8n como Event Bus visual** para centralizar la orquestación de todos los eventos externos del sistema FindYourWork.

**Principio fundamental:** "Todo evento externo pasa por n8n"

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FUENTES EXTERNAS                                   │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────────┤
│   Stripe    │    PayU     │ MercadoPago │  Partner    │  Telegram/Email    │
│   Webhook   │   Webhook   │   Webhook   │  Webhook    │     Webhook        │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴─────────┬──────────┘
       │             │             │             │                │
       ▼             ▼             ▼             ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DJANGO WEBHOOK ENDPOINTS                             │
│  /webhooks/payments/stripe/  │  /webhooks/partner/  │  /webhooks/telegram/  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENT BUS SERVICE                                   │
│                    (api_rest/services/event_bus.py)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              n8n (Docker)                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │ Payment Handler│  │Partner Handler │  │ MCP Input      │  │ Scheduled  │ │
│  │ Workflow       │  │ Workflow       │  │ Handler        │  │ Tasks      │ │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  └─────┬──────┘ │
└──────────┼───────────────────┼───────────────────┼─────────────────┼────────┘
           │                   │                   │                 │
           ▼                   ▼                   ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ACCIONES DE SALIDA                                  │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────────┤
│  WebSocket  │   Email     │  Django     │  AI         │  Partner           │
│  Notify     │   Send      │  Update     │ Orchestrator│  Webhook           │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────────┘
```

## 📁 Estructura de Archivos

```
Backend/
├── n8n-eventbus/
│   ├── docker-compose.yml          # Configuración Docker de n8n
│   ├── .env                         # Variables de entorno (crear desde .env.example)
│   ├── .env.example                 # Variables de entorno de ejemplo
│   ├── workflows/
│   │   ├── 01-payment-handler.json  # Workflow 1: Pagos
│   │   ├── 02-partner-handler.json  # Workflow 2: Partners
│   │   ├── 03-mcp-input-handler.json # Workflow 3: MCP
│   │   └── 04-scheduled-tasks.json  # Workflow 4: Cron
│   └── README.md                    # Este archivo
│
└── Python/
    └── api_rest/
        ├── services/
        │   ├── __init__.py
        │   └── event_bus.py         # Servicio Event Bus
        ├── views/
        │   ├── webhook_views.py     # Endpoints de webhooks
        │   ├── report_views.py      # Endpoints de reportes (n8n scheduled tasks)
        │   └── partner_views.py     # Endpoints de partners
        ├── urls/
        │   ├── urls_webhooks.py     # URLs de webhooks
        │   ├── urls_reports.py      # URLs de reportes
        │   └── urls_partner.py      # URLs de partners
        ├── tests/
        │   ├── test_webhooks.py     # Tests de webhooks
        │   └── test_n8n_integration.py # Tests de integración n8n
        └── signals.py               # Signals actualizados
```

## 🚀 Instalación y Configuración

### 1. Configurar Variables de Entorno

```bash
cd Backend/n8n-eventbus
cp .env.example .env
# Editar .env con tus valores
```

### 2. Iniciar n8n con Docker

```bash
cd Backend/n8n-eventbus
docker-compose up -d
```

### 3. Acceder a n8n

- URL: http://localhost:5678
- Usuario: admin (configurable en .env)
- Contraseña: tu_password (configurable en .env)

### 4. Importar Workflows

1. Acceder a n8n
2. Ir a "Workflows" > "Import from File"
3. Importar cada archivo JSON de `workflows/`

### 5. Configurar Credenciales en n8n

Configurar en n8n > Settings > Credentials:

- **SMTP** para envío de emails
- **Telegram Bot** para mensajería
- **Slack** para alertas (opcional)

## 📡 Workflows Implementados

### Workflow 1: Payment Handler

**Ruta:** `/webhook/payment-handler`

**Flujo:**
1. Recibe webhook de pasarela (Stripe/PayU/MercadoPago)
2. Valida payload y firma
3. Activa reserva en Django
4. Notifica via WebSocket
5. Envía email de confirmación
6. Dispara webhook al partner
7. Callback a Django

**Eventos soportados:**
- `payment.received`
- `payment.confirmed`
- `payment.failed`
- `payment.refunded`

### Workflow 2: Partner Handler

**Ruta:** `/webhook/partner-generic`

**Flujo:**
1. Recibe webhook del partner
2. Verifica firma HMAC-SHA256
3. Enruta según tipo de evento
4. Ejecuta acción de negocio
5. Responde ACK inmediatamente

**Eventos soportados:**
- `partner.sync_request`
- `partner.data_update`
- `partner.booking_request`
- `partner.notification`

### Workflow 3: MCP Input Handler

**Ruta:** `/webhook/mcp-input`

**Flujo:**
1. Recibe mensaje de Telegram/Email/WhatsApp
2. Extrae contenido y adjuntos
3. Envía al AI Orchestrator
4. Recibe respuesta
5. Envía respuesta por el mismo canal

**Canales soportados:**
- Telegram Bot
- Email (SendGrid/Mailgun)
- WhatsApp Business API

### Workflow 4: Scheduled Tasks

**Tareas programadas:**

| Tarea | Frecuencia | Descripción |
|-------|------------|-------------|
| `daily_report` | 08:00 diario | Genera y envía reporte |
| `cleanup_old_data` | 03:00 diario | Limpia datos >90 días |
| `send_reminders` | 09:00 y 18:00 | Recordatorios de reservas |
| `health_check` | Cada 5 min | Verifica servicios |
| `sync_partners` | Cada 6 horas | Sincroniza con partners |

## 🔌 Endpoints de Webhooks

### Pagos
```
POST /webhooks/payments/stripe/     # Stripe
POST /webhooks/payments/payu/       # PayU
POST /webhooks/payments/mercadopago/ # MercadoPago
POST /webhooks/payments/            # Genérico
```

### Partner
```
POST /webhooks/partner/             # Webhook de partner
```

### Mensajería (MCP)
```
POST /webhooks/telegram/            # Telegram Bot
POST /webhooks/email/               # Email entrante
POST /webhooks/whatsapp/            # WhatsApp Business
GET  /webhooks/whatsapp/verify/     # Verificación WhatsApp
```

### Tareas Programadas
```
POST /webhooks/tasks/trigger/       # Disparar tarea manual
GET  /webhooks/tasks/               # Listar tareas disponibles
```

### Health & Callbacks
```
GET  /webhooks/health/              # Health check
POST /webhooks/callback/            # Callback de n8n
```

## 📊 Endpoints de Reportes (para n8n Scheduled Tasks)

Estos endpoints son llamados por n8n para tareas programadas:

### Reportes
```
GET /api_rest/reports/daily/                # Reporte diario de estadísticas
    ?date=2026-01-01                        # (opcional) fecha específica

GET /api_rest/reports/pending-payments/     # Pagos pendientes de seguimiento
    ?days=3                                 # (opcional) días de antigüedad mínima
```

### Reservas
```
GET /api_rest/reservas/upcoming/            # Reservas próximas para recordatorios
    ?hours=24                               # (opcional) ventana de horas
```

### Mantenimiento
```
DELETE /api_rest/cleanup/old-data/          # Limpieza de datos antiguos
    ?days=90                                # (opcional) antigüedad mínima
    &dry_run=true                           # (opcional) solo simular

GET /api_rest/health/                       # Health check completo del sistema
```

## 🤝 Endpoints de Partners (para n8n Partner Handler)

Estos endpoints son llamados por n8n después de procesar webhooks de partners:

### Actualizaciones
```
POST /api_rest/partner-updates/             # Procesar actualización de partner
    Headers:
        X-Partner-Signature: sha256=xxx     # Firma HMAC
        X-Partner-ID: partner_abc           # ID del partner
    Body:
        {
            "event_type": "partner.price_update",
            "data": { "service_id": 1, "new_price": 150.00 }
        }
```

### Reservas desde Partners
```
POST /api_rest/reservas/partner/            # Crear reserva desde partner
    Body:
        {
            "partner_id": "partner_abc",
            "external_booking_id": "ext_123",
            "service_id": 1,
            "client_data": { "user_id": "uuid", "telefono": "123" },
            "fecha": "2026-01-15",
            "hora": "10:00:00"
        }

POST /api_rest/reservas/partner/cancel/     # Cancelar reserva desde partner
    Body:
        {
            "reserva_id": 1,
            "reason": "Cancelado por usuario"
        }
```

### Estado de Sincronización
```
GET /api_rest/partner/sync-status/          # Estado de sincronización
    ?partner_id=xxx                         # ID del partner (requerido)
```

## 💻 Uso del Event Bus Service

### Importar y usar

```python
from api_rest.services.event_bus import event_bus

# Emitir evento de pago
event_bus.emit_payment_received({
    'id': 123,
    'transaction_id': 'stripe_xxx',
    'amount': 50000,
    'currency': 'COP',
    'reserva_id': 456,
    'cliente_id': 789
})

# Emitir mensaje MCP
event_bus.emit_mcp_message(
    channel='telegram',
    message='Hola, necesito ayuda',
    sender_id='123456789',
    attachments=[],
    metadata={'username': 'user123'}
)

# Disparar tarea programada
event_bus.trigger_scheduled_task('daily_report', {'date': '2026-01-01'})

# Notificación multicanal
event_bus.send_notification(
    notification_type='reservation_confirmed',
    recipients=['user@email.com'],
    title='Reserva Confirmada',
    message='Tu reserva ha sido confirmada',
    channels=['email', 'websocket']
)
```

## 🔐 Seguridad

### Verificación de Firmas

**Partner webhooks (HMAC-SHA256):**
```python
signature = hmac.new(
    secret.encode('utf-8'),
    json.dumps(payload, sort_keys=True).encode('utf-8'),
    hashlib.sha256
).hexdigest()

# Header: X-Partner-Signature: sha256={signature}
```

**Stripe webhooks:**
```python
stripe.Webhook.construct_event(
    payload=request.body,
    sig_header=request.headers['Stripe-Signature'],
    secret=STRIPE_WEBHOOK_SECRET
)
```

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:8000/webhooks/health/
```

### Logs en Docker
```bash
docker-compose logs -f n8n
```

### Métricas n8n
- Acceder a: http://localhost:5678/metrics
- Configurado con: `N8N_METRICS=true`

## 🧪 Testing

### Probar webhook de pago
```bash
curl -X POST http://localhost:8000/webhooks/payments/stripe/ \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"amount":5000}}}'
```

### Probar webhook de partner
```bash
curl -X POST http://localhost:8000/webhooks/partner/ \
  -H "Content-Type: application/json" \
  -H "X-Partner-Signature: sha256=..." \
  -d '{"event_type":"partner.sync_request","data":{}}'
```

### Disparar tarea manual
```bash
curl -X POST http://localhost:8000/webhooks/tasks/trigger/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"task":"health_check"}'
```

### Probar reporte diario (llamado por n8n)
```bash
curl http://localhost:8000/api_rest/reports/daily/
curl "http://localhost:8000/api_rest/reports/daily/?date=2026-01-01"
```

### Probar reservas próximas (llamado por n8n para recordatorios)
```bash
curl "http://localhost:8000/api_rest/reservas/upcoming/?hours=24"
```

### Probar health check del sistema
```bash
curl http://localhost:8000/api_rest/health/
```

### Probar limpieza de datos (dry run)
```bash
curl -X DELETE "http://localhost:8000/api_rest/cleanup/old-data/?days=90&dry_run=true"
```

### Probar crear reserva desde partner
```bash
curl -X POST http://localhost:8000/api_rest/reservas/partner/ \
  -H "Content-Type: application/json" \
  -H "X-Partner-ID: test_partner" \
  -d '{
    "partner_id": "test_partner",
    "external_booking_id": "ext_123",
    "service_id": 1,
    "client_data": {"user_id": "550e8400-e29b-41d4-a716-446655440000", "telefono": "123456789"},
    "fecha": "2026-01-15",
    "hora": "10:00:00"
  }'
```

### Ejecutar tests de Django
```bash
cd Backend/Python
python manage.py test api_rest.tests.test_n8n_integration -v 2
```

## 📝 Variables de Entorno Requeridas

```env
# n8n
N8N_WEBHOOK_URL=http://localhost:5678
N8N_TIMEOUT=10
EVENT_BUS_ENABLED=true

# Partner
PARTNER_WEBHOOK_SECRET=your-secret

# Payment Gateways
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYU_MERCHANT_ID=xxx
PAYU_API_KEY=xxx

# Messaging
TELEGRAM_BOT_TOKEN=xxx
WHATSAPP_VERIFY_TOKEN=xxx
```

## ✅ Checklist de Implementación

- [x] Docker Compose para n8n
- [x] Servicio Event Bus en Django
- [x] Endpoints de webhooks para pagos
- [x] Endpoints de webhooks para partners
- [x] Endpoints de webhooks para MCP (Telegram/Email/WhatsApp)
- [x] Endpoints para tareas programadas
- [x] Workflow 1: Payment Handler
- [x] Workflow 2: Partner Handler
- [x] Workflow 3: MCP Input Handler
- [x] Workflow 4: Scheduled Tasks
- [x] Integración con Django Signals
- [x] Health checks
- [x] Documentación

## 🔗 Referencias

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
