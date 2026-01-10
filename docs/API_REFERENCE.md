# API Reference - Chuwue Grill

## Documentación de APIs de los Microservicios

---

## Auth Service (Puerto 8001)

### Base URL
```
http://localhost:8001
```

### Endpoints

#### POST /auth/register
Registra un nuevo usuario.

**Body**:
```json
{
  "username": "usuario123",
  "email": "usuario@email.com",
  "full_name": "Usuario Ejemplo",
  "telefono": "0991234567",
  "password": "password123"
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "username": "usuario123",
  "email": "usuario@email.com",
  "full_name": "Usuario Ejemplo",
  "is_active": true,
  "is_admin": false
}
```

---

#### POST /auth/login
Iniciar sesión y obtener tokens.

**Body**:
```json
{
  "email": "usuario@email.com",
  "password": "password123",
  "is_admin": false
}
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@email.com",
    "is_admin": false
  }
}
```

---

#### POST /auth/refresh
Renovar access token.

**Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### POST /auth/logout
Cerrar sesión y revocar tokens.

**Headers**: `Authorization: Bearer {access_token}`

**Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### GET /auth/me
Obtener usuario actual.

**Headers**: `Authorization: Bearer {access_token}`

---

#### GET /auth/validate
Validar token (uso interno).

**Headers**: `Authorization: Bearer {access_token}`

---

## Payment Service (Puerto 8002)

### Base URL
```
http://localhost:8002
```

### Endpoints de Pagos

#### POST /payments/create
Crear un nuevo pago.

**Body**:
```json
{
  "amount": 49.99,
  "currency": "USD",
  "description": "Reserva Mesa 5",
  "user_id": 1,
  "metadata": {
    "reservation_id": "RES123"
  }
}
```

**Response**: `200 OK`
```json
{
  "payment_id": "pay_abc123def456",
  "status": "pending",
  "amount": 49.99,
  "currency": "USD",
  "provider": "mock",
  "created_at": "2026-01-09T10:30:00Z"
}
```

---

#### GET /payments/{payment_id}
Obtener estado de un pago.

---

#### POST /payments/{payment_id}/refund
Reembolsar un pago.

---

#### GET /payments/
Listar pagos con paginación.

**Query Params**:
- `skip`: Offset (default: 0)
- `limit`: Límite (default: 20)
- `status_filter`: Filtrar por estado

---

### Endpoints de Partners

#### POST /partners/register
Registrar un nuevo partner B2B.

**Body**:
```json
{
  "partner_name": "Grupo-Tours",
  "webhook_url": "https://partner.com/webhooks",
  "events": ["reservation.confirmed", "payment.success"],
  "contact_email": "dev@partner.com"
}
```

---

#### GET /partners/
Listar partners registrados.

---

#### GET /partners/{partner_id}
Obtener información de un partner.

---

#### POST /partners/{partner_id}/send-webhook

---

## Diagnóstico de Integración

### Endpoints

- GET /integracion/pilar1/status
- GET /integracion/pilar2/status
- GET /integracion/status

### Headers estándar

- X-API-Version: v1
- X-Pilar1: enabled
- X-Pilar2: enabled
Enviar webhook de prueba a un partner.

---

### Webhooks

#### POST /webhooks/stripe
Recibir webhooks de Stripe.

**Headers**: `Stripe-Signature: {signature}`

---

#### POST /webhooks/mock
Recibir webhooks mock (testing).

---

#### POST /webhooks/partner/{partner_id}
Recibir webhooks de partners.

**Headers**: `X-HMAC-Signature: {hmac_signature}`

---

## AI Orchestrator (Puerto 8003)

### Base URL
```
http://localhost:8003
```

### Endpoints

#### POST /chat/message
Enviar mensaje al asistente IA.

**Body**:
```json
{
  "message": "Quiero ver el menú de alitas",
  "conversation_id": null,
  "channel": "web"
}
```

**Response**: `200 OK`
```json
{
  "conversation_id": "conv_abc123",
  "response": "Tenemos varias opciones de alitas...",
  "tool_used": "buscar_platos",
  "tool_result": {...},
  "timestamp": "2026-01-09T10:30:00Z"
}
```

---

#### POST /chat/message/with-image
Enviar mensaje con imagen (multimodal).

**Form Data**:
- `message`: Texto del mensaje
- `image`: Archivo de imagen
- `conversation_id`: ID de conversación (opcional)
- `channel`: Canal de origen

---

#### GET /chat/history/{conversation_id}
Obtener historial de una conversación.

---

#### GET /chat/conversations
Listar conversaciones recientes.

---

## Core API (Puerto 8000)

### Base URL
```
http://localhost:8000
```

*(API existente del Primer Parcial)*

### Endpoints principales

- `GET /platos/` - Listar platos
- `GET /reservas/` - Listar reservas
- `POST /reservas/` - Crear reserva
- `GET /mesas/` - Listar mesas
- `GET /clientes/` - Listar clientes

---

## GraphQL (Puerto 3010)

### Endpoint
```
POST http://localhost:3010/api/graphql
```

*(Servicio existente del Primer Parcial)*

---

## n8n Event Bus (Puerto 5678)

### Webhook Endpoints

| Ruta | Descripción |
|------|-------------|
| `/webhook/payment-webhook` | Recibe eventos de pago |
| `/webhook/partner-webhook` | Recibe eventos de partners |
| `/webhook/whatsapp` | Recibe mensajes de WhatsApp |

### Acceso al Dashboard
```
http://localhost:5678
User: admin
Password: admin123
```

---

## Integración B2B: FindyourWork (Puerto 8002)

### Registrar FindyourWork como Partner

```
POST http://localhost:8002/partners/register/findyourwork
Content-Type: application/json

{
  "webhook_url": "http://localhost:8000/webhooks/partner/",
  "contact_email": "dev@findyourwork.com"
}
```

**Response:**
```json
{
  "partner_id": "partner_findyourwork",
  "partner_name": "FindyourWork",
  "shared_secret": "whsec_abc123...",
  "status": "active"
}
```

---

### Verificar Estado de Integración

```
GET http://localhost:8002/partners/findyourwork/status
```

---

### Notificar Evento Corporativo a FindyourWork

```
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

---

### Recibir Webhooks de FindyourWork

```
POST http://localhost:8002/webhooks/partner/partner_findyourwork
Content-Type: application/json
X-HMAC-Signature: {firma_hmac}
X-Partner-ID: findyourwork

{
  "event_type": "service.booked_for_event",
  "data": {
    "external_event_id": "RES-2026-001",
    "service_name": "DJ Profesional",
    "provider": { "name": "DJ Sounds Pro", "phone": "0998765432" },
    "price": 250.00
  }
}
```

---

## Códigos de Error Comunes

| Código | HTTP | Descripción |
|--------|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Credenciales incorrectas |
| `AUTH_TOKEN_EXPIRED` | 401 | Token expirado |
| `AUTH_TOKEN_REVOKED` | 401 | Token revocado |
| `PAY_PAYMENT_FAILED` | 400 | Pago fallido |
| `PARTNER_HMAC_INVALID` | 401 | Firma HMAC inválida |
| `AI_TOOL_NOT_FOUND` | 404 | Herramienta MCP no encontrada |

---

## Headers Requeridos

### Autenticación
```
Authorization: Bearer {access_token}
```

### Webhooks HMAC
```
X-HMAC-Signature: {hmac_sha256_signature}
```

---

## Rate Limiting

- **Login**: 10 intentos por minuto
- **Chat**: 30 mensajes por minuto
- **Webhooks**: Sin límite (validación HMAC)

---

*Documentación API - Chuwue Grill - Segundo Parcial*
