# 📋 Resumen Completo del Proyecto - Segundo Parcial

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                          │
│                            Puerto: 5173                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY (Nginx) - Puerto: 80                    │
│   Enruta: /auth → 8001 | /payments → 8002 | /chat → 8003 | /api → 8000  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
     ┌────────────┬───────────────┼───────────────┬────────────┐
     │            │               │               │            │
┌────▼────┐ ┌─────▼─────┐ ┌───────▼───────┐ ┌────▼────┐ ┌──────▼──────┐
│  Auth   │ │  Payment  │ │      AI       │ │  Core   │ │    n8n      │
│ Service │ │  Service  │ │ Orchestrator  │ │   API   │ │  Event Bus  │
│  :8001  │ │   :8002   │ │     :8003     │ │  :8000  │ │    :5678    │
└─────────┘ └───────────┘ └───────────────┘ └─────────┘ └─────────────┘
  Pilar 1      Pilar 2        Pilar 3       Existente     Pilar 4
```

---

## 🔧 PILAR 1: Auth Service (15%)

**Tecnología:** Python + FastAPI + SQLite + JWT + Bcrypt

**Puerto:** 8001

**Objetivo:** Microservicio independiente de autenticación con JWT access/refresh tokens.

### Archivos Creados

| Archivo | Qué hace |
|---------|----------|
| `backend/auth_service/main.py` | **Punto de entrada** de la aplicación FastAPI. Configura CORS, registra routers, inicializa la BD y crea un usuario admin por defecto. |
| `backend/auth_service/config.py` | **Configuración centralizada** con variables de entorno: JWT_SECRET, tiempos de expiración, URL de BD. Usa `pydantic-settings`. |
| `backend/auth_service/database.py` | **Conexión a SQLite** usando SQLAlchemy. Define `get_db()` para inyección de dependencias y `init_db()` para crear tablas. |
| `backend/auth_service/Dockerfile` | **Imagen Docker** del servicio con Python 3.11, healthcheck y uvicorn. |
| `backend/auth_service/requirements.txt` | **Dependencias Python**: fastapi, uvicorn, python-jose, passlib, bcrypt, sqlalchemy, slowapi. |

### Carpeta `models/`

| Archivo | Qué hace |
|---------|----------|
| `models/user.py` | **Modelo de Usuario** con campos: id, username, email, full_name, telefono, hashed_password, is_active, is_admin, timestamps. |
| `models/refresh_token.py` | **Modelo RefreshToken** para almacenar tokens de renovación con usuario, expiración, IP y estado de revocación. |
| `models/revoked_token.py` | **Blacklist de tokens** - Guarda JTI (JWT ID) de tokens revocados para invalidarlos antes de su expiración natural. |

### Carpeta `routers/`

| Archivo | Qué hace |
|---------|----------|
| `routers/auth.py` | **Endpoints de autenticación**: `POST /auth/register` (crear usuario), `POST /auth/login` (obtener tokens), `POST /auth/logout` (revocar tokens), `POST /auth/refresh` (renovar access token). |
| `routers/users.py` | **Endpoints de usuario**: `GET /auth/me` (info usuario actual), `GET /auth/validate` (validar token - uso interno), `GET /auth/users` (listar usuarios - solo admin). |

### Carpeta `utils/`

| Archivo | Qué hace |
|---------|----------|
| `utils/jwt_handler.py` | **Manejo de JWT**: `create_access_token()` (token corto 30min), `create_refresh_token()` (token largo 7 días), `verify_token()`, `decode_token()`. Cada token tiene un JTI único. |
| `utils/password.py` | **Hash de contraseñas** con bcrypt: `hash_password()` y `verify_password()`. |

### Carpeta `middleware/`

| Archivo | Qué hace |
|---------|----------|
| `middleware/rate_limiter.py` | **Límite de intentos** usando slowapi: 10 intentos de login por minuto para prevenir ataques de fuerza bruta. |

### Endpoints del Auth Service

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión, retorna access + refresh token |
| POST | `/auth/logout` | Cerrar sesión, revoca tokens |
| POST | `/auth/refresh` | Renovar access token usando refresh token |
| GET | `/auth/me` | Obtener información del usuario actual |
| GET | `/auth/validate` | Validar token (uso interno para otros servicios) |

---

## 💳 PILAR 2: Payment Service + Webhooks B2B (20%)

**Tecnología:** Python + FastAPI + SQLite + Patrón Adapter + HMAC-SHA256

**Puerto:** 8002

**Objetivo:** Sistema de pagos con abstracción de pasarela y webhooks bidireccionales con partners.

### Archivos Creados

| Archivo | Qué hace |
|---------|----------|
| `backend/payment_service/main.py` | **Punto de entrada** FastAPI. Registra routers de payments, webhooks y partners. |
| `backend/payment_service/config.py` | **Configuración**: PAYMENT_PROVIDER (mock/stripe), claves de Stripe, timeout de webhooks. |
| `backend/payment_service/database.py` | **Conexión SQLite** para pagos y partners. |
| `backend/payment_service/Dockerfile` | **Imagen Docker** del servicio. |
| `backend/payment_service/requirements.txt` | **Dependencias**: fastapi, stripe, httpx, sqlalchemy. |

### Carpeta `models/`

| Archivo | Qué hace |
|---------|----------|
| `models/payment.py` | **Modelo Payment** con: payment_id, user_id, amount, currency, status (pending/completed/failed/refunded), provider, timestamps. |
| `models/partner.py` | **Modelo Partner** para B2B: partner_id, partner_name, webhook_url, shared_secret, subscribed_events (JSON), estadísticas de éxito/fallo. |

### Carpeta `adapters/` (Patrón Adapter)

| Archivo | Qué hace |
|---------|----------|
| `adapters/base.py` | **Interface abstracta** `PaymentProvider` que define el contrato: `create_payment()`, `get_payment_status()`, `refund_payment()`, `verify_webhook()`, `parse_webhook()`. |
| `adapters/mock_adapter.py` | **Implementación Mock** para desarrollo. Simula pagos: amount < $1 falla, $1-$100 éxito inmediato, >$100 pendiente. Firma webhooks con HMAC. |
| `adapters/stripe_adapter.py` | **Implementación Stripe** real. Crea PaymentIntents, verifica webhooks con firma de Stripe, mapea estados. |

### Carpeta `routers/`

| Archivo | Qué hace |
|---------|----------|
| `routers/payments.py` | **CRUD de pagos**: `POST /payments/create` (crear pago), `GET /payments/{id}` (estado), `POST /payments/{id}/refund` (reembolso), `GET /payments/` (listar). |
| `routers/webhooks.py` | **Recepción de webhooks**: `POST /webhooks/stripe` (de Stripe), `POST /webhooks/mock` (de mock), `POST /webhooks/partner/{id}` (de partners B2B con verificación HMAC). |
| `routers/partners.py` | **Gestión de partners B2B**: `POST /partners/register` (registrar partner, genera shared_secret), `GET /partners/` (listar), `POST /partners/{id}/send-webhook` (enviar test). |

### Carpeta `utils/`

| Archivo | Qué hace |
|---------|----------|
| `utils/hmac_signer.py` | **Firma HMAC-SHA256**: `sign_payload()` y `verify_signature()` para autenticar webhooks bidireccionales. |
| `utils/event_normalizer.py` | **Normaliza eventos** de diferentes pasarelas a formato común (NormalizedEvent). |

### Patrón Adapter Explicado

```python
# Interface abstracta (contrato)
class PaymentProvider(ABC):
    @abstractmethod
    async def create_payment(self, amount, currency, description) -> PaymentResult:
        pass

# Implementación Mock (desarrollo)
class MockAdapter(PaymentProvider):
    async def create_payment(self, amount, currency, description):
        # Simula el pago
        return PaymentResult(success=True, payment_id="pay_mock123")

# Implementación Stripe (producción)
class StripeAdapter(PaymentProvider):
    async def create_payment(self, amount, currency, description):
        # Llama a la API real de Stripe
        intent = stripe.PaymentIntent.create(...)
        return PaymentResult(success=True, payment_id=intent.id)
```

**Ventaja:** Cambiar de Mock a Stripe solo requiere cambiar una variable de entorno, sin tocar código.

---

## 🤖 PILAR 3: AI Orchestrator + MCP Tools (20%)

**Tecnología:** Python + FastAPI + Groq LLM + MCP (Model Context Protocol)

**Puerto:** 8003

**Objetivo:** Chatbot multimodal con herramientas MCP para ejecutar acciones de negocio.

### Archivos Creados

| Archivo | Qué hace |
|---------|----------|
| `backend/ai_orchestrator/main.py` | **Punto de entrada** FastAPI. Configura el orquestador de IA con soporte para Groq o Mock. |
| `backend/ai_orchestrator/config.py` | **Configuración**: GROQ_API_KEY, modelo de chat y visión, URL del Core API. |
| `backend/ai_orchestrator/database.py` | **Conexión SQLite** para historial de conversaciones. |
| `backend/ai_orchestrator/Dockerfile` | **Imagen Docker** con Tesseract OCR instalado para análisis de imágenes. |
| `backend/ai_orchestrator/requirements.txt` | **Dependencias**: fastapi, groq, pillow, pytesseract, PyMuPDF. |

### Carpeta `models/`

| Archivo | Qué hace |
|---------|----------|
| `models/conversation.py` | **Modelos de chat**: `Conversation` (sesión de chat con user_id y channel) y `Message` (mensajes individuales con role, content, tool_name). |

### Carpeta `adapters/` (Patrón Strategy)

| Archivo | Qué hace |
|---------|----------|
| `adapters/base.py` | **Interface abstracta** `LLMProvider`: define `generate()` para chat y `analyze_image()` para visión. |
| `adapters/groq_adapter.py` | **Implementación Groq** real. Usa `llama-3.1-70b-versatile` para chat y `llama-3.2-90b-vision-preview` para análisis de imágenes. Soporta tool calls. |
| `adapters/mock_adapter.py` | **Implementación Mock** para desarrollo sin API key. Simula respuestas y detecta cuándo usar herramientas. |

### Carpeta `mcp/` (MCP Server)

| Archivo | Qué hace |
|---------|----------|
| `mcp/server.py` | **Servidor MCP** que orquesta herramientas. `get_tools_for_llm()` retorna definiciones para el LLM, `execute()` ejecuta una herramienta. |
| `mcp/tools/__init__.py` | **Registro de tools**: expone `get_all_tools()` y `execute_tool()`. |

### Carpeta `mcp/tools/` (5 Herramientas MCP)

| Archivo | Herramienta | Tipo | Qué hace |
|---------|-------------|------|----------|
| `consulta_tools.py` | `buscar_platos` | Consulta | Busca platos en el menú por nombre/categoría. Conecta con Core API. |
| `consulta_tools.py` | `ver_reserva` | Consulta | Obtiene detalles de una reserva por ID. |
| `accion_tools.py` | `crear_reserva` | Acción | Crea nueva reserva con cliente, fecha, hora, personas. |
| `accion_tools.py` | `registrar_cliente` | Acción | Registra nuevo cliente con nombre, teléfono, email. |
| `reporte_tools.py` | `resumen_ventas` | Reporte | Genera estadísticas de ventas del día/semana/mes. |

### Carpeta `routers/`

| Archivo | Qué hace |
|---------|----------|
| `routers/chat.py` | **Endpoints de chat**: `POST /chat/message` (enviar mensaje, puede usar tools), `POST /chat/message/with-image` (multimodal con imagen), `GET /chat/history/{id}` (historial), `GET /chat/conversations` (listar). |

### Flujo de una Conversación con MCP

```
Usuario: "Quiero reservar mesa para 4 el viernes a las 8pm"
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  AI Orchestrator recibe mensaje                      │
│  1. Construye contexto con historial                │
│  2. Envía a Groq LLM con definiciones de tools      │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Groq LLM detecta que necesita crear_reserva        │
│  Retorna: tool_call = {                             │
│    "name": "crear_reserva",                         │
│    "arguments": {                                   │
│      "cliente_nombre": "Usuario",                   │
│      "fecha": "2026-01-17",                         │
│      "hora": "20:00",                               │
│      "personas": 4                                  │
│    }                                                │
│  }                                                  │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  MCP Server ejecuta crear_reserva()                  │
│  → Llama a Core API POST /reservas/                 │
│  → Retorna: {success: true, reserva: {...}}         │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  AI Orchestrator envía resultado a Groq             │
│  Groq genera respuesta final en lenguaje natural    │
└─────────────────────────────────────────────────────┘
    │
    ▼
Respuesta: "¡Listo! He creado tu reserva para 4 personas 
            el viernes 17 de enero a las 8:00 PM. 
            Tu código es RES123ABC."
```

---

## 📡 PILAR 4: n8n Event Bus (15%)

**Tecnología:** n8n (Docker) + Workflows JSON

**Puerto:** 5678

**Objetivo:** Centralizar orquestación de eventos externos con workflows visuales.

### Workflows Creados

| Archivo | Nombre | Qué hace |
|---------|--------|----------|
| `n8n/workflows/payment_handler.json` | Payment Handler | Recibe webhook de pago → Valida payload → Si éxito: activa servicio → Notifica WebSocket → Webhook a partner → Responde ACK |
| `n8n/workflows/partner_handler.json` | Partner Handler | Recibe webhook de partner → Verifica firma HMAC → Procesa según tipo (reserva u otro) → Ejecuta acción → Responde ACK |
| `n8n/workflows/whatsapp_handler.json` | WhatsApp Handler | Recibe mensaje de Evolution API → Extrae contenido → Envía a AI Orchestrator → Responde por WhatsApp |
| `n8n/workflows/scheduled_tasks.json` | Scheduled Tasks | Cron diario 23:00 → Genera reporte de ventas via AI → Envía email → Limpia tokens expirados |

### Diagrama del Payment Handler

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Webhook    │────▶│   Validar    │────▶│  ¿Exitoso?   │
│   Trigger    │     │   Payload    │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          │ SÍ                   │                   NO │
                          ▼                      │                      ▼
                   ┌──────────────┐              │             ┌──────────────┐
                   │   Activar    │              │             │   Loguear    │
                   │   Servicio   │              │             │   Evento     │
                   └──────┬───────┘              │             └──────────────┘
                          │                      │
                          ▼                      │
                   ┌──────────────┐              │
                   │  Notificar   │              │
                   │  WebSocket   │              │
                   └──────┬───────┘              │
                          │                      │
                          ▼                      │
                   ┌──────────────┐              │
                   │  Webhook a   │              │
                   │   Partner    │              │
                   └──────┬───────┘              │
                          │                      │
                          ▼                      │
                   ┌──────────────┐              │
                   │  Respuesta   │◀─────────────┘
                   │     ACK      │
                   └──────────────┘
```

---

## 🌐 API Gateway (Nginx)

**Tecnología:** Nginx

**Puerto:** 80

| Archivo | Qué hace |
|---------|----------|
| `nginx/nginx.conf` | **Configuración de routing**: `/auth/` → 8001, `/payments/` → 8002, `/chat/` → 8003, `/api/` → 8000, `/webhooks/` → n8n, `/ws/` → WebSocket con upgrade. |
| `nginx/Dockerfile` | **Imagen Nginx Alpine** con healthcheck. |

### Tabla de Rutas

| Ruta | Destino | Puerto | Servicio |
|------|---------|--------|----------|
| `/auth/*` | auth_service | 8001 | Auth Service |
| `/payments/*` | payment_service | 8002 | Payment Service |
| `/partners/*` | payment_service | 8002 | Payment Service |
| `/chat/*` | ai_orchestrator | 8003 | AI Orchestrator |
| `/api/*` | core_api | 8000 | Core API (P1) |
| `/graphql` | graphql | 3010 | GraphQL (P1) |
| `/ws/*` | websocket | 3001 | WebSocket Ruby (P1) |
| `/webhooks/*` | n8n | 5678 | n8n Event Bus |
| `/evolution/*` | evolution-api | 8080 | Evolution API |
| `/health` | - | - | Health check del gateway |

---

## 🎨 Frontend (React + TypeScript)

**Tecnología:** React 19 + Vite + TypeScript + CSS

### Archivos Creados

| Archivo | Qué hace |
|---------|----------|
| `frontend/src/components/ChatBot.tsx` | **Widget de chat flotante**. Botón rojo en esquina inferior derecha. Al hacer clic, abre ventana de chat. Envía mensajes al AI Orchestrator. Soporta adjuntar imágenes. Muestra indicador de herramienta usada. |
| `frontend/src/css/ChatBot.css` | **Estilos del chatbot**: tema oscuro, animaciones de entrada, mensajes con burbujas, spinner de carga, preview de imágenes, responsive para móvil. |
| `frontend/src/pages/admin/Chat.tsx` | **Panel de admin para chat**: sidebar con lista de conversaciones, filtro de búsqueda, vista de mensajes con roles (usuario/asistente), estadísticas de uso. |
| `frontend/src/pages/admin/Pagos.tsx` | **Panel de admin para pagos**: tabla de transacciones con columnas (ID, monto, estado, provider, fecha), filtros por estado, cards de estadísticas (total, completados, pendientes, ingresos). |
| `frontend/src/pages/admin/Partners.tsx` | **Panel de admin para partners B2B**: cards de partners registrados con estadísticas de webhooks, modal para registrar nuevo partner, botón para enviar webhook de prueba, banner de integración pendiente. |
| `frontend/src/css/AdminPanel.css` | **Estilos compartidos** para paneles admin: layout con sidebar, tablas, modales, badges de estado, formularios, cards de estadísticas. |

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/App.tsx` | Se agregaron: imports de nuevas páginas (Chat, Pagos, Partners), rutas protegidas `/admin/chat`, `/admin/pagos`, `/admin/partners`, componente `<ChatBot />` fuera de Routes para que aparezca en todas las páginas. |

---

## 📦 Shared (Utilidades Compartidas)

| Archivo | Qué hace |
|---------|----------|
| `backend/shared/__init__.py` | Exporta las utilidades compartidas. |
| `backend/shared/error_handler.py` | **Formato de errores estándar**: clase `APIError` con campos (status, error, message, details, timestamp, path, request_id). Diccionario `ERROR_CODES` con códigos por servicio (AUTH_*, PAY_*, AI_*, PARTNER_*). |
| `backend/shared/jwt_validator.py` | **Validación local de JWT**: función `validate_jwt_local(token)` que verifica firma y expiración sin llamar al Auth Service. Usa el SECRET compartido via variable de entorno. |

### Formato de Error Estándar

```json
{
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Token expirado o inválido",
  "details": [
    {
      "field": "authorization",
      "message": "Token JWT expirado",
      "code": "AUTH_TOKEN_EXPIRED"
    }
  ],
  "timestamp": "2026-01-09T10:30:00Z",
  "path": "/auth/me",
  "request_id": "req_abc123"
}
```

---

## 🐳 Docker Compose

| Archivo | Qué hace |
|---------|----------|
| `docker-compose.yml` | **Orquestación completa** de 10 servicios con redes y volúmenes. |
| `env.example` | **Template de variables de entorno** con valores de ejemplo. |

### Servicios en Docker Compose

| Servicio | Puerto | Imagen/Build | Descripción |
|----------|--------|--------------|-------------|
| nginx | 80 | ./nginx | API Gateway |
| auth_service | 8001 | ./backend/auth_service | Autenticación |
| payment_service | 8002 | ./backend/payment_service | Pagos y Partners |
| ai_orchestrator | 8003 | ./backend/ai_orchestrator | Chat IA |
| evolution-api | 8080 | atendai/evolution-api | WhatsApp |
| core_api | 8000 | ./backend/apirest_python | API REST (P1) |
| graphql | 3010 | ./backend/Graphql_tp | GraphQL (P1) |
| websocket | 3001 | ./backend/websocket_ruby | WebSocket (P1) |
| n8n | 5678 | n8nio/n8n | Event Bus |
| frontend | 5173 | ./frontend | React App |

---

## 📚 Documentación

| Archivo | Qué hace |
|---------|----------|
| `docs/PARTNER_INTEGRATION.md` | **Guía completa para partners**: cómo registrarse, formato de eventos, código de verificación HMAC en Python y JavaScript, eventos disponibles, ejemplos de payloads. |
| `docs/MCP_TOOLS.md` | **Documentación de herramientas MCP**: descripción de cada tool, parámetros con tipos, ejemplos de uso, respuestas esperadas. |
| `docs/API_REFERENCE.md` | **Referencia de APIs**: todos los endpoints de Auth, Payment y AI con ejemplos de request/response, headers requeridos, códigos de error. |
| `README.md` | **README actualizado**: arquitectura de 4 pilares, diagrama ASCII, quick start con Docker, estructura del proyecto, checklist de requisitos. |

---

## 📊 Resumen por Tecnología

| Tecnología | Uso en el Proyecto |
|------------|-------------------|
| **Python 3.11** | Lenguaje principal para microservicios |
| **FastAPI** | Framework web para Auth, Payment, AI |
| **SQLite** | Base de datos ligera para cada servicio |
| **SQLAlchemy** | ORM para modelos y queries |
| **JWT (python-jose)** | Tokens de acceso y refresh |
| **Bcrypt (passlib)** | Hash seguro de contraseñas |
| **Groq API** | Proveedor de LLM (Llama 3.1) |
| **HMAC-SHA256** | Firma de webhooks bidireccionales |
| **Nginx** | API Gateway y reverse proxy |
| **n8n** | Orquestación visual de workflows |
| **Docker** | Contenedores de servicios |
| **Docker Compose** | Orquestación multi-contenedor |
| **React 19** | Framework de frontend |
| **TypeScript** | Tipado estático para React |
| **Vite** | Build tool y dev server |
| **Evolution API** | Integración con WhatsApp |

---

## ✅ Checklist de Requisitos Cumplidos

| # | Requisito | Estado | Ubicación |
|---|-----------|--------|-----------|
| 1 | Auth JWT + refresh tokens | ✅ | `backend/auth_service/` |
| 2 | Pasarela pago (MockAdapter) | ✅ | `backend/payment_service/adapters/` |
| 3 | Webhooks bidireccionales | ✅ PLACEHOLDER | `backend/payment_service/routers/partners.py` |
| 4 | Chatbot multimodal (texto + imagen) | ✅ | `backend/ai_orchestrator/` |
| 5 | 5 MCP Tools funcionales | ✅ | `backend/ai_orchestrator/mcp/tools/` |
| 6 | 4 workflows n8n | ✅ | `n8n/workflows/` |
| 7 | Notificaciones WebSocket | ✅ | Existente del P1 |
| 8 | Tarea programada (cron) | ✅ | `n8n/workflows/scheduled_tasks.json` |
| 9 | Dashboard con nuevos módulos | ✅ | `frontend/src/pages/admin/` |
| 10 | Manejo errores estructurado | ✅ | `backend/shared/error_handler.py` |
| 11 | API Gateway (Nginx) | ✅ | `nginx/` |
| 12 | Documentación completa | ✅ | `docs/` |

---

## 🚀 Cómo Ejecutar

### Con Docker (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/Proyecto-autonomo-servidores.git
cd Proyecto-autonomo-servidores

# 2. Configurar variables de entorno
cp env.example .env
# Editar .env y agregar GROQ_API_KEY

# 3. Levantar todos los servicios
docker-compose up -d

# 4. Ver logs
docker-compose logs -f
```

### Sin Docker (Desarrollo)

```bash
# Terminal 1: Auth Service
cd backend/auth_service
pip install -r requirements.txt
python main.py

# Terminal 2: Payment Service
cd backend/payment_service
pip install -r requirements.txt
python main.py

# Terminal 3: AI Orchestrator
cd backend/ai_orchestrator
pip install -r requirements.txt
python main.py

# Terminal 4: Frontend
cd frontend
npm install
npm run dev
```

### URLs de Acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Frontend | http://localhost:5173 | - |
| Auth Service Docs | http://localhost:8001/auth/docs | - |
| Payment Service Docs | http://localhost:8002/docs | - |
| AI Orchestrator Docs | http://localhost:8003/chat/docs | - |
| n8n Dashboard | http://localhost:5678 | admin / admin123 |
| Admin Panel | http://localhost:5173/admin | admin@chuwuegrill.com / admin123 |

---

## 🔐 Webhooks Partner (Pendiente de Integración)

Los webhooks bidireccionales están implementados como **PLACEHOLDER** listos para conectar con otro grupo.

### Para Activar la Integración

1. **El otro grupo registra su webhook:**
```bash
POST http://localhost:8002/partners/register
Content-Type: application/json

{
  "partner_name": "Grupo-Tours",
  "webhook_url": "https://su-servidor.com/webhooks/chuwue",
  "events": ["reservation.confirmed", "payment.success"],
  "contact_email": "dev@grupo-tours.com"
}
```

2. **Guardan el `shared_secret` retornado**

3. **Verifican webhooks recibidos con HMAC-SHA256**

Ver documentación completa en `docs/PARTNER_INTEGRATION.md`

---

*Documento generado para el Segundo Parcial - Chuwue Grill*
