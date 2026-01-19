# FindyourWork

## Descripción General
FindyourWork es una plataforma innovadora que conecta a proveedores de servicios con clientes potenciales. La aplicación facilita la publicación, búsqueda y reserva de servicios profesionales, creando un ecosistema eficiente para la contratación de servicios.

## 🎯 Características Principales

### ✨ Nuevas - Sistema WebSocket en Tiempo Real

- ⚡ **WebSocket en Tiempo Real**: Comunicación bidireccional con Socket.IO
- 📡 **Eventos de Negocio Automáticos**: Notificaciones instantáneas cuando ocurren acciones
- 📊 **Dashboard en Vivo**: Visualización de eventos, conexiones y métricas en tiempo real
- 📈 **Estadísticas de Negocio**: Servicios disponibles, clientes registrados, reservas por mes
- 🔔 **Notificaciones Segmentadas**: Alertas por rol (cliente, proveedor, admin)
- 🔄 **Sincronización Automática**: Datos actualizados sin recargar la página

### Funcionalidades Generales

- Registro y autenticación de usuarios
- Perfiles diferenciados para proveedores y clientes
- Publicación y gestión de servicios
- Sistema de reservas
- Calificaciones y comentarios
- Gestión de ubicaciones
- Sistema de pagos
- Categorización de servicios
- Comunicación en tiempo real

## Arquitectura del Proyecto

El proyecto está construido con una arquitectura moderna y distribuida, con un **nuevo servidor WebSocket** para comunicación en tiempo real:

```
REST API (Django) ──→ WebSocket Server (NestJS) ──→ Frontend (React)
       ↓                                ↓                    ↓
  Eventos                     Difusión en tiempo real   Actualización UI
```

### Componentes

1. **API REST (Python/Django)** - Puerto 8000
   - Gestión principal de datos
   - Autenticación y autorización
   - Emisión de eventos al WebSocket

2. **Servidor WebSocket (NestJS/TypeScript)** - Puerto 4000 ✨ **NUEVO**
   - Comunicación en tiempo real
   - Gestión de conexiones y salas
   - Historial de eventos
   - Dashboard de monitoreo

3. **GraphQL (Golang)** - Consultas optimizadas (Opcional)

4. **Frontend (React/TypeScript)** - Puerto 5173
   - Interfaz de usuario moderna
   - Conexión WebSocket para eventos en vivo
   - Dashboard con gráficos y estadísticas

## 🚀 Inicio Rápido

### 1. Servidor WebSocket (NestJS)

```bash
cd Backend/TypeScript
npm install
npm run start:dev
```

**Dashboard**: http://localhost:4000/dashboard.html
**API**: http://localhost:4000/api

### 2. API REST (Django)

```bash
cd Backend/Python
python -m venv venv
venv\Scripts\activate  # o source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**API**: http://localhost:8000/api

### 3. Frontend (React)

```bash
cd Frontend
npm install
npm run dev
```

**App**: http://localhost:5173

## 📁 Estructura del Proyecto

```
├── Frontend/                           # React + TypeScript + Vite
│   ├── src/
│   │   ├── websocket/
│   │   │   └── socket.ts              # Cliente WebSocket mejorado
│   │   ├── api/
│   │   │   └── dashboardApi.ts        # API del dashboard
│   │   ├── types/
│   │   │   └── dashboard.ts           # Tipos e interfaces
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Dashboard WebSocket
│   │   │   ├── StatisticsPage.tsx    # Página de estadísticas
│   │   │   └── ...
│   │   └── ...
│   └── package.json
│
├── Backend/
│   ├── TypeScript/                    # Servidor WebSocket (NestJS) ✨ NUEVO
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── websocket/             # Módulo WebSocket
│   │   │   │   ├── websocket.gateway.ts
│   │   │   │   ├── websocket.service.ts
│   │   │   │   ├── websocket.module.ts
│   │   │   │   └── types.ts
│   │   │   ├── dashboard/             # Módulo Dashboard
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   └── dashboard.module.ts
│   │   │   └── health/
│   │   ├── public/
│   │   │   └── dashboard.html         # Dashboard del servidor
│   │   ├── WEBSOCKET_INTEGRATION.md   # Guía de integración
│   │   └── package.json
│   │
│   ├── Python/                        # API REST (Django)
│   │   ├── api_rest/
│   │   │   ├── models/
│   │   │   ├── views/
│   │   │   ├── serializers/
│   │   │   └── ...
│   │   ├── WEBSOCKET_INTEGRATION_EXAMPLE.md
│   │   └── manage.py
│   │
│   └── Golang/                        # GraphQL (Opcional)
│       └── ...
│
├── QUICK_START.md                     # Guía de instalación rápida ✨
└── README.md
```

## 🔌 Integración WebSocket

### En Django (Backend Python)

Cuando ocurre una acción importante (crear reserva, nuevo servicio, etc.), Django envía un evento al servidor WebSocket:

```python
from api_rest.services.websocket_notifier import websocket_notifier

# Emitir evento
websocket_notifier.emit_event('reserva:creada', {
    'reserva': {
        'id': 1,
        'clienteId': 123,
        'estado': 'confirmada',
        'fecha': '2024-11-15',
        'totalEstimado': 50000
    }
})

# Notificar a proveedores
websocket_notifier.notify_role('proveedor', 'nueva_reserva', {...})
```

Ver: `Backend/Python/WEBSOCKET_INTEGRATION_EXAMPLE.md`

### En React (Frontend)

Escuchar eventos en tiempo real:

```typescript
import { authenticateSocket, onReservaNueva } from './websocket/socket';

// Conectar
await authenticateSocket({
  token: 'token-jwt',
  userId: 'user-123',
  role: 'cliente'
});

// Escuchar eventos
onReservaNueva((data) => {
  console.log('Nueva reserva:', data);
  // Actualizar UI
});
```

## 📊 Endpoints del WebSocket

### REST API

```http
GET  /api/dashboard                  # Resumen del dashboard
GET  /api/dashboard/stats            # Estadísticas detalladas
GET  /api/dashboard/status           # Estado de la plataforma
GET  /api/dashboard/metrics          # Métricas del WebSocket
POST /api/dashboard/emit-event       # Emitir evento de negocio
POST /api/dashboard/notify-role      # Notificar a un rol
POST /api/dashboard/notify-user      # Notificar a un usuario
```

### WebSocket Events

**Cliente → Servidor:**
- `authenticate` - Autenticar usuario
- `join_room` - Unirse a una sala
- `leave_room` - Salir de una sala
- `ping` - Keep-alive

**Servidor → Cliente:**
- `negocio:evento` - Evento de negocio general
- `reserva:nueva` - Nueva reserva creada
- `servicio:disponible` - Nuevo servicio
- `dashboard:update` - Actualización del dashboard
- `dashboard:metrics` - Métricas del WebSocket

## 📚 Documentación

- **Guía Rápida**: Ver `QUICK_START.md`
- **WebSocket Integration**: Ver `Backend/TypeScript/WEBSOCKET_INTEGRATION.md`
- **Django Integration**: Ver `Backend/Python/WEBSOCKET_INTEGRATION_EXAMPLE.md`
- **Frontend**: Ver `Frontend/README_NEW.md`
- **Backend TypeScript**: Ver `Backend/TypeScript/README.md`
- **Backend Python**: Ver `Backend/Python/README.md`

## 🧪 Testing

### Verificar que todo esté corriendo

```bash
# Terminal 1: WebSocket
cd Backend/TypeScript && npm run start:dev

# Terminal 2: Django
cd Backend/Python && python manage.py runserver

# Terminal 3: Frontend
cd Frontend && npm run dev

# Terminal 4: Probar endpoints
curl http://localhost:4000/api/health
curl http://localhost:8000/api/
curl http://localhost:5173
```

### Dashboard del Servidor

Abre http://localhost:4000/dashboard.html para ver:
- Conexiones activas
- Eventos en tiempo real
- Métricas del WebSocket
- Salas activas

## 🔗 Flujo de Datos

```
1. Usuario realiza acción en Frontend (React)
   ↓
2. Frontend envía request a Django REST API
   ↓
3. Django procesa y guarda en BD
   ↓
4. Django emite evento al WebSocket Server (NestJS)
   ↓
5. WebSocket difunde a todos los clientes conectados
   ↓
6. Frontend recibe evento en tiempo real
   ↓
7. UI se actualiza sin recargar página
```

## 🛠️ Configuración

### Variables de Entorno

**Backend/TypeScript/.env:**
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Backend/Python/mi_proyecto/settings.py:**
```python
WS_SERVER_URL = 'http://localhost:4000/api'
```

## 🐛 Solución de Problemas

### WebSocket no se conecta
- Verifica que el servidor en puerto 4000 esté corriendo
- Comprueba CORS en `src/main.ts`
- Revisa la consola del navegador

### Django no emite eventos
- Instala requests: `pip install requests`
- Verifica `WS_SERVER_URL` en settings
- Revisa los logs de Django

### Puerto en uso
```bash
# Linux/Mac
lsof -i :4000

# Windows
netstat -ano | findstr :4000
```

## 📦 Tecnologías

- **Frontend**: React 19, TypeScript, Vite, Socket.IO Client
- **Backend REST**: Django, DRF, PostgreSQL/SQLite
- **Backend WebSocket**: NestJS, Socket.IO, Express
- **GraphQL**: Golang (opcional)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/Feature`)
3. Commit cambios (`git commit -m 'Add Feature'`)
4. Push (`git push origin feature/Feature`)
5. Abre un Pull Request

## 📄 Licencia

Proyecto de Universidad - Todos los derechos reservados

## 👥 Equipo

- **Desarrollador**: MarlonX-a
- **Proyecto**: 5to Año - Apps de Servicios Web

## 📞 Soporte

Para más información sobre:
- **Instalación Rápida**: Ver `QUICK_START.md`
- **WebSocket**: Ver `Backend/TypeScript/README.md`
- **Django**: Ver `Backend/Python/README.md`
- **Frontend**: Ver `Frontend/README_NEW.md`