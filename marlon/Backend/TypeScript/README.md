# Servidor WebSocket - FindYourWork

Sistema de comunicación en tiempo real para la plataforma de servicios FindYourWork, implementado con NestJS y Socket.IO.

## 🚀 Características

- ✅ Comunicación bidireccional en tiempo real
- ✅ Gestión automática de conexiones
- ✅ Autenticación y autorización por roles
- ✅ Sistema de salas para notificaciones segmentadas
- ✅ Historial de eventos
- ✅ Dashboard de monitoreo en tiempo real
- ✅ Integración con Django REST API

## 📋 Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+ o yarn
- Acceso al puerto 4000

## 🔧 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=4000
NODE_ENV=development

# URLs de la API Django
DJANGO_API_URL=http://localhost:8000/api

# CORS (Frontend)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. Compilar TypeScript

```bash
npm run build
```

## 🏃 Ejecución

### Modo desarrollo (con recarga en vivo)

```bash
npm run start:dev
```

### Modo producción

```bash
npm run start:prod
```

### En segundo plano

```bash
npm run start &
```

## 📊 Acceder al Dashboard

Una vez que el servidor está corriendo:

- **Dashboard Web**: http://localhost:4000/dashboard.html
- **API Health**: http://localhost:4000/api/health

## 🔌 WebSocket Endpoints

El servidor WebSocket está disponible en `ws://localhost:4000/ws`

### Eventos disponibles

#### Cliente → Servidor

- `authenticate` - Autenticar usuario
- `join_room` - Unirse a una sala
- `leave_room` - Salir de una sala
- `ping` - Mantener viva la conexión

#### Servidor → Cliente

- `auth_success` - Autenticación exitosa
- `auth_error` - Error de autenticación
- `negocio:evento` - Evento de negocio general
- `reserva:nueva` - Nueva reserva creada
- `servicio:disponible` - Nuevo servicio disponible
- `dashboard:update` - Actualización del dashboard
- `dashboard:metrics` - Métricas en tiempo real

## 🔌 REST API Endpoints

### Obtener Resumen del Dashboard

```http
GET /api/dashboard
```

### Obtener Estadísticas Detalladas

```http
GET /api/dashboard/stats
```

### Obtener Estado de la Plataforma

```http
GET /api/dashboard/status
```

### Emitir Evento de Negocio

```http
POST /api/dashboard/emit-event
Content-Type: application/json

{
  "type": "reserva:creada",
  "data": { "reserva": {...} },
  "timestamp": "2024-11-15T14:30:00Z"
}
```

### Notificar a Rol Específico

```http
POST /api/dashboard/notify-role
Content-Type: application/json

{
  "role": "proveedor",
  "event": "nueva_solicitud",
  "payload": {...}
}
```

### Notificar a Usuario Específico

```http
POST /api/dashboard/notify-user
Content-Type: application/json

{
  "userId": "user_123",
  "event": "reserva_confirmada",
  "payload": {...}
}
```

## 📁 Estructura de Carpetas

```
src/
├── main.ts                 # Punto de entrada
├── app.module.ts           # Módulo principal
├── websocket/             # Módulo WebSocket
│   ├── websocket.gateway.ts
│   ├── websocket.service.ts
│   ├── websocket.module.ts
│   └── types.ts
├── dashboard/             # Módulo Dashboard
│   ├── dashboard.service.ts
│   ├── dashboard.controller.ts
│   └── dashboard.module.ts
└── health/               # Módulo Health Check
    └── health.controller.ts

public/
└── dashboard.html         # Dashboard del servidor

WEBSOCKET_INTEGRATION.md   # Guía de integración con Django
```

## 🔗 Integración con Django

Ver `WEBSOCKET_INTEGRATION.md` para instrucciones detalladas sobre cómo integrar el servidor WebSocket con tu API REST de Django.

Resumen rápido:

1. Crea un servicio `WebSocketNotifier` en Django
2. En tus signals de Django, emite eventos al servidor WebSocket
3. Los eventos se difunden automáticamente a todos los clientes conectados

## 🧪 Testing

Ejecuta los tests:

```bash
npm test
```

Con cobertura:

```bash
npm run test:cov
```

## 📚 Ejemplo de Uso - Frontend React

```typescript
import { useEffect, useState } from 'react';
import { authenticateSocket, onReservaNueva, getSocket } from '../websocket/socket';

export function MiComponente() {
  const [reservas, setReservas] = useState([]);

  useEffect(() => {
    // Autenticar
    authenticateSocket({
      token: 'tu-token-jwt',
      userId: 'usuario-123',
      role: 'cliente'
    });

    // Escuchar nuevas reservas
    const unsubscribe = onReservaNueva((data) => {
      setReservas(prev => [...prev, data]);
    });

    return unsubscribe;
  }, []);

  return <div>{/* Tu UI aquí */}</div>;
}
```

## 🛠️ Troubleshooting

### "Puerto 4000 ya está en uso"

```bash
# Encontrar y matar el proceso
lsof -i :4000
kill -9 <PID>

# O cambiar el puerto en .env
PORT=4001
```

### "Cannot find module '@nestjs/'"

```bash
# Limpiar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### WebSocket no se conecta

1. Verifica que el servidor esté corriendo: `npm run start:dev`
2. Comprueba la consola del navegador para errores
3. Verifica que CORS está configurado correctamente
4. Asegúrate de usar `ws://` (no `http://`) para WebSocket

## 📝 Licencia

Proyecto de Universidad - Todos los derechos reservados

## 👥 Contribuidores

Desarrollado para el proyecto autónomo de Apps de Servicios Web (5to A)

## 📞 Soporte

Para preguntas sobre la integración WebSocket, consulta `WEBSOCKET_INTEGRATION.md`
