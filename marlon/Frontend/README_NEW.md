# FindYourWork - Frontend

Interfaz de usuario para la plataforma de servicios FindYourWork, construida con React, TypeScript y Vite.

## 🚀 Características

- ⚡ Vite para desarrollo rápido
- 🔐 Autenticación JWT con WebSocket
- 📡 Comunicación en tiempo real con WebSocket
- 📊 Dashboard con gráficos y estadísticas en vivo
- 🎨 Interfaz responsiva y moderna
- ♿ Accesibilidad
- 🛠️ TypeScript para tipado estático
- 📱 Optimizado para móvil y desktop

## 📋 Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+ o yarn

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Crear archivo .env (opcional)
echo "VITE_API_URL=http://localhost:8000/api" > .env.local
echo "VITE_WS_URL=http://localhost:4000/ws" >> .env.local
```

## 🏃 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

## 🏗️ Build para Producción

```bash
# Compilar la aplicación
npm run build

# Previsualizar la build de producción
npm run preview
```

## 📁 Estructura de Carpetas

```
src/
├── App.tsx                     # Componente principal
├── main.tsx                    # Punto de entrada
├── index.css                   # Estilos globales
├── api/                        # Servicios API
│   ├── dashboardApi.ts        # Servicio del dashboard
│   ├── graphql.ts             # Cliente GraphQL
│   └── ...
├── websocket/                 # Comunicación WebSocket
│   └── socket.ts              # Cliente WebSocket
├── context/                   # Context API
│   ├── AuthContext.tsx
│   └── AuthProvider.tsx
├── interfaces/                # Interfaces de TypeScript
├── types/                     # Tipos adicionales
│   └── dashboard.ts
├── pages/                     # Páginas
│   ├── Dashboard.tsx          # Dashboard del WebSocket
│   ├── StatisticsPage.tsx    # Página de estadísticas
│   ├── loginPage.tsx
│   ├── registerPage.tsx
│   ├── profilePage.tsx
│   ├── homePage.tsx
│   ├── Cliente/
│   └── Proveedor/
├── components/                # Componentes reutilizables
│   ├── Navbar.tsx
│   └── Footer.tsx
└── assets/                    # Archivos estáticos
```

## 🔌 WebSocket Integration

### Conectar y Autenticar

```typescript
import { authenticateSocket, onReservaNueva } from './websocket/socket';

async function connectWebSocket() {
  try {
    await authenticateSocket({
      token: 'tu-token-jwt',
      userId: 'user-123',
      role: 'cliente' // 'cliente' | 'proveedor' | 'admin'
    });
    console.log('✅ Conectado al WebSocket');
  } catch (error) {
    console.error('❌ Error conectando:', error);
  }
}
```

### Escuchar Eventos

```typescript
import { onBusinessEvent, onReservaNueva, onServicioDisponible } from './websocket/socket';

// Escuchar cualquier evento de negocio
onBusinessEvent((event) => {
  console.log('Evento recibido:', event);
});

// Escuchar específicamente nuevas reservas
onReservaNueva((data) => {
  console.log('Nueva reserva:', data);
  // Actualizar UI aquí
});

// Escuchar servicios nuevos
onServicioDisponible((data) => {
  console.log('Servicio disponible:', data);
});
```

### Obtener Datos del Dashboard

```typescript
import { getDashboardSummary } from './websocket/socket';
import { DashboardApiService } from './api/dashboardApi';

// Obtener resumen del WebSocket
const summary = await getDashboardSummary();

// Obtener estadísticas detalladas
const stats = await DashboardApiService.getDashboardStats();
const platformStatus = await DashboardApiService.getPlatformStatus();
```

## 📊 Páginas Disponibles

### Dashboard (WebSocket)
- **URL**: `/dashboard`
- **Descripción**: Muestra conexiones activas, eventos recientes y métricas del WebSocket
- **Componente**: `Dashboard.tsx`

### Estadísticas (Statistics Page)
- **URL**: `/statistics`
- **Descripción**: Página completa con gráficos y estadísticas de negocio
- **Componente**: `StatisticsPage.tsx`
- **Características**:
  - Servicios disponibles
  - Número de clientes registrados
  - Reservas por mes
  - Calificaciones promedio
  - Estado de la plataforma en tiempo real

### Páginas de Usuario

- **Login**: `/login` - Autenticación
- **Register**: `/register` - Registro de usuarios
- **Home**: `/` - Página principal
- **Profile**: `/profile` - Perfil del usuario
- **Cliente**: `/cliente/*` - Panel de cliente
- **Proveedor**: `/proveedor/*` - Panel de proveedor

## 🔐 Autenticación

La aplicación usa JWT tokens almacenados en localStorage:

```typescript
// Obtener token del storage
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const role = localStorage.getItem('role');

// Conectar WebSocket con autenticación
await authenticateSocket({ token, userId, role });
```

## 🎨 Estilos

La aplicación usa Tailwind CSS para estilos. Edita los archivos CSS directamente o crea clases Tailwind en los componentes.

## 🧪 Linting

```bash
# Verificar código
npm run lint

# Arreglar problemas automáticos
npm run lint -- --fix
```

## 📚 Documentación Adicional

- [WebSocket Integration Guide](../Backend/TypeScript/WEBSOCKET_INTEGRATION.md)
- [API REST Documentation](../Backend/Python/README.md)
- [Backend TypeScript Setup](../Backend/TypeScript/README.md)

## 🐛 Solución de Problemas

### WebSocket no se conecta
- Verifica que el servidor WebSocket esté corriendo en `http://localhost:4000`
- Comprueba la consola del navegador para errores
- Verifica que CORS está configurado correctamente

### API REST retorna errores
- Asegúrate que Django está corriendo en `http://localhost:8000`
- Verifica la autorización con tokens JWT
- Comprueba los logs de Django

### Cambios no se reflejan en vivo
- Asegúrate que Vite HMR está habilitado
- Reinicia el servidor de desarrollo
- Limpia la caché del navegador

## 📦 Dependencias Principales

- `react@^19.1.1` - Librería UI
- `react-router-dom@^7.9.1` - Enrutamiento
- `socket.io-client@^4.8.1` - Cliente WebSocket
- `axios@^1.12.2` - Cliente HTTP
- `react-hook-form@^7.64.0` - Manejo de formularios
- `jwt-decode@^4.0.0` - Decodificación de JWT
- `lucide-react@^0.553.0` - Iconos

## 🚀 Deployment

```bash
# Build para producción
npm run build

# Los archivos estáticos se generan en la carpeta dist/
# Sirve estos archivos con tu servidor web favorito
```

## 📄 Licencia

Proyecto de Universidad - Todos los derechos reservados
