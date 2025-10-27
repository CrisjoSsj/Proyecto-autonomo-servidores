# 🍗 Chuwue Grill - Sistema Integral de Restaurante

## 🏗️ Arquitectura Multi-Tecnología

Sistema completo de gestión para el restaurante **Chuwue Grill** con **3 tecnologías backend diferentes** integradas en un único frontend. Implementa arquitectura de microservicios con comunicación REST, GraphQL y WebSocket en tiempo real.

### 🎯 Tecnologías Backend Implementadas

| Tecnología | Puerto | Uso en Frontend | Funcionalidad |
|-----------|---------|----------------|---------------|
| **🐍 API REST (FastAPI)** | 8000 | FilaVirtual.tsx | CRUD de mesas, cola de espera, reservas |
| **� GraphQL (Next.js)** | 3000 | Dashboard.tsx | Estadísticas, analytics, reportes en tiempo real |
| **🔌 WebSocket (Ruby)** | 8080 | FilaVirtual.tsx + GestionMesas.tsx | Actualizaciones en tiempo real de mesas y cola |

### ✨ Integración Frontend

El frontend **React + Vite** consume las 3 tecnologías simultáneamente:
- **API REST**: Operaciones CRUD tradicionales
- **GraphQL**: Queries complejas para dashboard
- **WebSocket**: Notificaciones push en tiempo real

---

## 🔧 Últimas Actualizaciones (27 Oct 2024)

### ✅ Correcciones Implementadas
- **API REST**: Agregado endpoint `/fila-virtual/` como alias para compatibilidad frontend
- **CSS Reportes**: Rediseño completo con 600+ líneas de CSS moderno, gradientes y efectos hover
- **GraphQL**: Schema y resolvers completamente reescritos para sistema de restaurante
- **WebSocket**: Integración verificada para actualizaciones en tiempo real

### 📚 Documentación Adicional Creada
- [`IMPLEMENTACION_TECNOLOGIAS.md`](./IMPLEMENTACION_TECNOLOGIAS.md) - Cómo está implementada cada tecnología
- [`GUIA_VISUAL.md`](./GUIA_VISUAL.md) - Guía visual de qué página usa qué tecnología
- [`CORRECCIONES_27_OCT.md`](./CORRECCIONES_27_OCT.md) - Detalles técnicos de las correcciones
- [`ANTES_DESPUES_REPORTES.md`](./ANTES_DESPUES_REPORTES.md) - Cambios visuales en Reportes

---

## 🎯 Características Principales

### 👥 **Interfaz de Cliente**
- **Página de Inicio**: Presentación del restaurante con platos destacados y información esencial
- **Menú Digital**: Visualización completa del menú categorizado con precios y descripciones
- **Sistema de Reservas**: Formulario para reservas de ocasiones especiales con selección de fecha/hora
- **Fila Virtual**: Consulta de disponibilidad de mesas en tiempo real y sistema de cola
- **Navegación Intuitiva**: Interfaz responsive con nombres de clases descriptivos en español

### 🏢 **Panel de Administración**
- **Dashboard Central**: Estadísticas en tiempo real, alertas inteligentes y acciones rápidas
- **Gestión de Mesas**: Control completo de ocupación, liberación y cola de espera virtual
- **Gestión de Reservas**: Administración de reservas con calendario y gestión de eventos
- **Gestión de Menú**: CRUD completo de categorías, platos, precios e inventario
- **Sistema de Reportes**: Analytics, reportes financieros y recomendaciones de negocio

## 🛠️ Stack Tecnológico Completo

### 🐍 **API REST (Python)** - Puerto 8000
- **FastAPI** - Framework web moderno y de alto rendimiento
- **Pydantic** - Validación de datos y serialización
- **JWT** - Autenticación y autorización segura
- **Passlib + Bcrypt** - Hashing seguro de contraseñas
- **Uvicorn** - Servidor ASGI de alto rendimiento
- **psycopg2** - Adaptador PostgreSQL para Python
- **Frontend Integration**: `ApiService.ts` en FilaVirtual.tsx, GestionMesas.tsx

### 📊 **GraphQL Server (Next.js)** - Puerto 3000
- **Next.js 14** - Framework React para producción
- **Apollo Server** - Servidor GraphQL robusto
- **GraphQL** - Query language para APIs
- **TypeScript** - Tipado estático completo
- **Frontend Integration**: `GraphQLService.ts` (Apollo Client) en Dashboard.tsx

### 💎 **WebSocket Server (Ruby)** - Puerto 8080
- **Ruby 3.x** - Lenguaje de programación dinámico y expresivo
- **EventMachine** - Programación asíncrona y manejo de eventos
- **em-websocket** - Implementación WebSocket para EventMachine
- **JSON** - Intercambio de datos estructurados
- **pg gem** - Adaptador PostgreSQL para Ruby
- **Frontend Integration**: `WebSocketService.ts` en FilaVirtual.tsx, GestionMesas.tsx

### ⚡ **Backend Services (TypeScript)** - Legacy
- **TypeScript** - Tipado estático para JavaScript
- **Domain-Driven Design** - Arquitectura de dominio bien estructurada
- **Interfaces** - Contratos claros entre componentes

### 🎨 **Frontend (React + TypeScript)** - Puerto 5173
- **React 19** - Framework principal para interfaces de usuario
- **Vite** - Build tool moderno y servidor de desarrollo ultra-rápido
- **TypeScript** - Tipado estático para JavaScript (archivos .tsx)
- **React Router DOM** - Enrutamiento SPA para navegación fluida
- **Tailwind CSS** - Framework de CSS utilitario para diseño responsive
- **ESLint** - Linter para mantener calidad del código
- **Servicios de Integración**:
  - `ApiService.ts` - Cliente HTTP para API REST
  - `GraphQLService.ts` - Apollo Client para GraphQL
  - `WebSocketService.ts` - Cliente WebSocket nativo


## 📁 Estructura del Proyecto

```
Proyecto-autonomo-servidores/
├── 🐍 apirest_python/         # API REST Principal (Python + FastAPI) - Puerto 8000
│   ├── routers/               # Endpoints organizados por entidad
│   │   ├── auth.py           # Autenticación JWT
│   │   ├── user.py           # Gestión de usuarios
│   │   ├── Restaurante.py    # CRUD de restaurantes
│   │   ├── Cliente.py        # CRUD de clientes
│   │   ├── Mesa.py           # Gestión de mesas ✅ (usado por FilaVirtual.tsx)
│   │   ├── Reserva.py        # Sistema de reservas
│   │   ├── Menu.py           # Gestión de menús
│   │   ├── Plato.py          # CRUD de platos
│   │   ├── CategoriaMenu.py  # Categorías de menú
│   │   └── FilaVirtual.py    # Cola virtual ✅ (endpoints /filas/ y /fila-virtual/)
│   ├── main.py               # Aplicación principal FastAPI
│   ├── requirements.txt      # Dependencias Python
│   └── .venv/               # Entorno virtual Python
│
├── 📊 Graphql_tp/            # Servidor GraphQL (Next.js + Apollo) - Puerto 3000
│   ├── app/
│   │   ├── api/graphql/route.ts    # API route de GraphQL
│   │   └── graphql-playground/     # Interfaz GraphQL Playground
│   ├── lib/graphql/
│   │   ├── schema.ts         # Schema GraphQL ✅ (usado por Dashboard.tsx)
│   │   └── resolvers.ts      # Resolvers con datos de restaurante
│   ├── components/           # Componentes UI de Next.js
│   ├── next.config.mjs       # Configuración Next.js
│   └── package.json          # Dependencias
│
├── 💎 websocket_ruby/         # Servidor WebSocket (Ruby) - Puerto 8080
│   ├── app/
│   │   ├── channels/         # Canales de comunicación
│   │   │   ├── fila_virtual_channel.rb    # Canal de fila ✅ (FilaVirtual.tsx)
│   │   │   ├── mesas_channel.rb           # Canal de mesas ✅ (GestionMesas.tsx)
│   │   │   └── reservas_channel.rb        # Canal de reservas
│   │   ├── connections/      # Gestión de conexiones
│   │   │   └── connection_manager.rb
│   │   └── utils/           # Utilidades
│   │       └── message_builder.rb
│   ├── server.rb            # Servidor principal WebSocket
│   ├── Gemfile              # Dependencias Ruby
│   └── Gemfile.lock
│
├── ⚡ backend/               # Servicios de Dominio (TypeScript) - Legacy
│   ├── src/
│   │   ├── domain/          # Entidades de dominio
│   │   │   ├── Restaurante.ts    # Entidad Restaurante
│   │   │   ├── Cliente.ts        # Entidad Cliente
│   │   │   ├── Mesa.ts           # Entidad Mesa
│   │   │   ├── Reserva.ts        # Entidad Reserva
│   │   │   ├── Menu.ts           # Entidad Menu
│   │   │   ├── Plato.ts          # Entidad Plato
│   │   │   ├── CategoriaMenu.ts  # Entidad Categoria
│   │   │   └── FilaVirtual.ts    # Entidad FilaVirtual
│   │   ├── application/     # Servicios de aplicación
│   │   │   ├── RestauranteService.ts     # Lógica de restaurante
│   │   │   ├── ClienteService.ts         # Lógica de cliente
│   │   │   ├── MesaService.ts            # Lógica de mesas
│   │   │   ├── ReservaService.ts         # Lógica de reservas
│   │   │   ├── MenuService.ts            # Lógica de menú
│   │   │   ├── PlatoService.ts           # Lógica de platos
│   │   │   ├── CategoriaService.ts       # Lógica de categorías
│   │   │   └── FilaService.ts            # Lógica de fila virtual
│   │   ├── infrastructure/  # Capa de infraestructura
│   │   │   └── ClienteRepository.ts
│   │   ├── utils/          # Utilidades
│   │   └── main.ts         # Punto de entrada
│   ├── package.json        # Dependencias Node.js
│   └── tsconfig.json       # Configuración TypeScript
│
├── 🎨 frontend/              # Interfaz de Usuario (React + TypeScript)
│   ├── public/             # Archivos estáticos
│   │   └── vite.svg       # Logo de Vite
├── src/
│   ├── assets/            # Recursos (imágenes, iconos)
│   │   └── react.svg
│   ├── components/        # Componentes reutilizables
│   │   ├── MenuCard.tsx           # Tarjeta de elemento del menú
│   │   ├── Navbar.tsx             # Barra de navegación del usuario
│   │   ├── ReservaForm.tsx        # Formulario de reservas
│   │   ├── PiePagina.tsx          # Footer del sitio
│   │   └── admin/                 # Componentes de administración
│   │       └── NavbarAdmin.tsx    # Navegación del panel admin
│   ├── css/              # Estilos CSS personalizados
│   │   ├── Home.css      # Estilos de la página de inicio
│   │   └── Menu.css      # Estilos del menú
│   ├── interface/        # Definiciones de tipos TypeScript
│   │   └── MenuCardProps.ts
│   ├── pages/            # Páginas de la aplicación
│   │   ├── user/         # Páginas del cliente
│   │   │   ├── FilaVirtual.tsx    # Fila virtual y disponibilidad
│   │   │   ├── Home.tsx           # Página de inicio
│   │   │   ├── Menu.tsx           # Menú completo del restaurante
│   │   │   └── Reservas.tsx       # Sistema de reservas
│   │   └── admin/        # Páginas de administración
│   │       ├── Dashboard.tsx      # Panel principal de admin
│   │       ├── GestionMesas.tsx   # Gestión de mesas y cola
│   │       ├── GestionReservas.tsx # Gestión de reservas
│   │       ├── GestionMenu.tsx    # Gestión del menú e inventario
│   │       └── Reportes.tsx       # Analytics y reportes
│   ├── App.tsx           # Componente principal con rutas
│   ├── main.tsx          # Punto de entrada de la aplicación
│   └── index.css         # Estilos globales
├── package.json          # Dependencias y scripts
├── vite.config.ts        # Configuración de Vite
├── tailwind.config.js    # Configuración de Tailwind CSS
└── tsconfig.json         # Configuración de TypeScript
```

## 🌐 Rutas de la Aplicación

### 👥 **Rutas de Cliente**
| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | **Inicio** | Presentación del restaurante, platos destacados e información de contacto |
| `/menu` | **Menú** | Menú completo categorizado (Alitas, Hamburguesas, Parrilladas, etc.) |
| `/reservas` | **Reservas** | Sistema de reservas para ocasiones especiales con formulario completo |
| `/filavirtual` | **Fila Virtual** | Disponibilidad de mesas en tiempo real y sistema de cola virtual |

### 🏢 **Rutas de Administración**
| Ruta | Página | Descripción |
|------|--------|-------------|
| `/admin` | **Dashboard** | Panel principal con estadísticas, alertas y acciones rápidas |
| `/admin/mesas` | **Gestión de Mesas** | Control de ocupación, liberación de mesas y gestión de cola |
| `/admin/reservas` | **Gestión de Reservas** | Administración de reservas con calendario y eventos |
| `/admin/menu` | **Gestión de Menú** | CRUD de categorías, platos, precios e inventario |
| `/admin/reportes` | **Reportes** | Analytics, reportes financieros y recomendaciones |

## 🎨 Sistema de Diseño

### **Paleta de Colores**
- **Rojo Principal**: `#DC2626` (bg-red-600) - Color brand del restaurante
- **Amarillo de Acento**: `#FDE047` (text-yellow-300) - Estados hover y destacados  
- **Blanco/Gris**: Para fondos, texto y elementos neutros

### **Clases CSS Descriptivas**
El proyecto utiliza **nombres de clases descriptivos en español** para mejor comprensión:
- `tarjeta-plato-menu` en lugar de `menu-card`
- `boton-navegacion` en lugar de `nav-button`  
- `contenedor-principal` en lugar de `main-container`
- `seccion-estadisticas-admin` en lugar de `admin-stats`

### **Componentes de UI**
- **Responsive Design**: Optimizado para desktop, tablet y móvil
- **Tailwind CSS**: Framework utilitario para estilos consistentes
- **Componentes Modulares**: Reutilizables entre páginas de usuario y admin

## 🔧 Funcionalidades Administrativas

### **📊 Dashboard de Control**
- **Estadísticas en Tiempo Real**: Ventas del día, órdenes completadas, clientes atendidos
- **Estado del Restaurante**: Ocupación de mesas, cola de espera, reservas, personal
- **Sistema de Alertas**: Mesas con tiempo excedido, inventario bajo, nuevas reservas
- **Acciones Rápidas**: Navegación directa a gestión de mesas, reservas, menú y reportes

### **🍽️ Gestión de Mesas**
- **Control de Ocupación**: Asignar clientes a mesas disponibles
- **Liberación de Mesas**: Finalizar servicio y generar cuentas
- **Estados Detallados**: Disponible, Ocupada, Reservada, En Limpieza
- **Cola Virtual**: Gestión de clientes en espera con tiempos estimados
- **Alertas de Tiempo**: Notificaciones para mesas con tiempo excedido

### **📅 Gestión de Reservas**
- **Calendario Interactivo**: Vista de reservas por día/semana/mes
- **CRUD Completo**: Crear, editar, cancelar reservas
- **Eventos Corporativos**: Gestión especializada para grupos grandes
- **Control de Disponibilidad**: Validación automática de horarios y capacidad

### **🍕 Gestión de Menú e Inventario**
- **Categorías Dinámicas**: Crear y gestionar categorías de platos
- **CRUD de Platos**: Agregar, editar, eliminar platos con precios
- **Control de Inventario**: Stock en tiempo real con alertas de reabastecimiento
- **Estados de Productos**: Disponible, Agotado, Temporalmente Inactivo
- **Análisis de Ventas**: Platos más vendidos y estadísticas por categoría

### **📈 Sistema de Reportes**
- **Analytics de Ventas**: Tendencias, comparaciones y proyecciones
- **Reportes Financieros**: Ingresos, costos y márgenes de ganancia
- **Estadísticas Operativas**: Tiempo promedio de servicio, rotación de mesas
- **Recomendaciones**: Sugerencias basadas en datos para optimización

## ⚙️ Configuración Técnica

### React + Vite
Esta es una aplicación **React** construida con **Vite** como herramienta de desarrollo y build. Vite proporciona:
- Servidor de desarrollo ultra-rápido con Hot Module Replacement (HMR)
- Build optimizado para producción
- Soporte nativo para TypeScript y JSX/TSX
- Configuración mínima comparado con webpack

### ESLint
Configurado con reglas específicas para React y TypeScript para mantener la calidad del código.

### Tailwind CSS
Framework de utilidades CSS configurado con PostCSS para estilos eficientes y responsive.

## � Instalación y Desarrollo

1. **Instala las dependencias**:
   ```bash
   npm install
   ```

2. **Inicia el servidor de desarrollo de Vite**:
   ```bash
   npm run dev
   ```
   Esto iniciará el servidor en `http://localhost:5173` con hot reload automático.

3. **Scripts disponibles**:
   - `npm run dev` - Inicia el servidor de desarrollo de Vite
   - `npm run build` - Construye la aplicación React para producción usando Vite
   - `npm run lint` - Ejecuta ESLint para revisar el código
   - `npm run preview` - Previsualiza la build de producción

## �🚀 Deployment

Para hacer deploy de la aplicación React:

1. **Construye la aplicación con Vite**:
   ```bash
   npm run build
   ```
   Esto compilará la aplicación React y generará archivos optimizados.

2. **La carpeta `dist/` contendrá** los archivos estáticos listos para producción

3. **Despliega** los archivos en tu servidor web preferido (Netlify, Vercel, Apache, Nginx, etc.)

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- **Python 3.8+** para la API REST
- **Ruby 2.7+** para el servidor WebSocket
- **Node.js 16+** para GraphQL server y React frontend
- **PostgreSQL 14+** para la base de datos compartida

### **1️⃣ Configuración API REST (Python)** - Puerto 8000
```bash
cd apirest_python
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### **2️⃣ Configuración GraphQL Server (Next.js)** - Puerto 3000
```bash
cd Graphql_tp
npm install
# o con pnpm:
pnpm install
npm run dev
# Acceder a GraphQL Playground: http://localhost:3000/graphql-playground
```

### **3️⃣ Configuración WebSocket Server (Ruby)** - Puerto 8080
```bash
cd websocket_ruby
bundle install
ruby server.rb
```

### **4️⃣ Configuración Frontend (React)** - Puerto 5173
```bash
cd frontend
npm install
npm run dev
```

### **🌐 URLs de Acceso**
| Servicio | URL | Documentación |
|----------|-----|---------------|
| **API REST** | `http://localhost:8000` | Swagger: `http://localhost:8000/docs` |
| **GraphQL** | `http://localhost:3000/api/graphql` | Playground: `http://localhost:3000/graphql-playground` |
| **WebSocket** | `ws://localhost:8080` | - |
| **Frontend** | `http://localhost:5173` | - |

### **🔍 Verificación de Servicios**

#### **Verificar API REST:**
```bash
curl http://localhost:8000/fila-virtual/
# Debe retornar JSON con lista de filas
```

#### **Verificar GraphQL:**
```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ totalReservas }"}'
# Debe retornar: {"data":{"totalReservas":42}}
```

#### **Verificar WebSocket:**
- Abrir `websocket_ruby/public/filaV.html` en navegador
- Conectar al WebSocket
- Debe mostrar: "Conectado al servidor WebSocket"

## 🎯 Estado del Proyecto

### **✅ Tecnologías Backend - IMPLEMENTADAS Y FUNCIONANDO**

#### **🐍 API REST (Python + FastAPI)** - ✅ OPERATIVO
- [x] **CRUD Completo** - 9 entidades con operaciones completas
- [x] **Autenticación JWT** - Sistema seguro de login y tokens
- [x] **Validación de Datos** - Pydantic models con validación automática
- [x] **Manejo de Errores** - HTTPException en todos los endpoints
- [x] **Documentación Automática** - Swagger UI y ReDoc
- [x] **Estructura Modular** - Routers organizados por entidad
- [x] **Integración Frontend** - FilaVirtual.tsx consume endpoints `/fila-virtual/` y `/mesas/`

#### **� GraphQL Server (Next.js + Apollo)** - ✅ OPERATIVO
- [x] **Schema Completo** - Tipos para Reserva, Mesa, Plato, EstadisticasVentas
- [x] **Resolvers Implementados** - totalReservas, reservasPorMes, mesasPopulares, platosPopulares
- [x] **Datos de Prueba** - Sample data para testing y demo
- [x] **GraphQL Playground** - Interfaz interactiva en `/graphql-playground`
- [x] **Integración Frontend** - Dashboard.tsx consume queries con Apollo Client
- [x] **Banner Visible** - Identificación clara "Datos desde GraphQL" en Dashboard

#### **�💎 WebSocket Server (Ruby + EventMachine)** - ✅ OPERATIVO
- [x] **Servidor WebSocket** - Comunicación en tiempo real
- [x] **Canales Especializados** - Fila virtual, mesas y reservas
- [x] **Gestión de Conexiones** - Connection manager robusto
- [x] **Message Builder** - Construcción de mensajes estructurados
- [x] **Event Handling** - Manejo de eventos del restaurante
- [x] **Integración Frontend** - FilaVirtual.tsx y GestionMesas.tsx reciben updates en tiempo real

#### **🎨 Frontend (React + TypeScript)** - ✅ OPERATIVO
- [x] **Interfaz de Usuario Completa** - 4 páginas de cliente
- [x] **Panel de Administración** - 5 páginas de gestión
- [x] **Sistema de Rutas** - React Router con navegación
- [x] **Diseño Responsive** - Optimizado para todos los dispositivos
- [x] **Componentes Modulares** - Reutilizables y organizados
- [x] **Integración Multi-Tecnología**:
  - `ApiService.ts` - Cliente HTTP para API REST
  - `GraphQLService.ts` - Apollo Client para GraphQL
  - `WebSocketService.ts` - Cliente WebSocket nativo
- [x] **CSS Moderno** - Reportes.css con 600+ líneas, gradientes y efectos hover

### **🏗️ Arquitectura de Integración**
- [x] **Microservicios Distribuidos** - Cada componente independiente
- [x] **Comunicación REST** - API endpoints para operaciones CRUD
- [x] **GraphQL Queries** - Dashboard analytics con Apollo Client
- [x] **WebSocket Real-Time** - Updates bidireccionales para mesas y fila virtual
- [x] **Frontend Unificado** - React consume las 3 tecnologías simultáneamente
- [x] **Tipado Compartido** - Interfaces consistentes entre servicios
- [x] **Separación de Responsabilidades** - Cada tecnología en su dominio específico

### **🔄 Mejoras Futuras**
- [ ] **Base de Datos Compartida** - PostgreSQL con conexiones desde Python/Ruby/GraphQL
- [ ] **Docker Compose** - Orquestación de los 4 servicios (API REST, GraphQL, WebSocket, Frontend)
- [ ] **Testing Integrado** - Pruebas end-to-end que validen integración
- [ ] **CI/CD Pipeline** - Deployment automatizado multi-servicio
- [ ] **Monitoreo** - Logs y métricas centralizadas con Prometheus/Grafana
- [ ] **Autenticación Compartida** - JWT validado en las 3 tecnologías backend

---

## 🔧 Troubleshooting

### **Error: 404 en `/fila-virtual/`**
**Solución**: Reiniciar el servidor API REST después de agregar nuevos endpoints
```bash
cd apirest_python
# Detener servidor (Ctrl+C)
uvicorn main:app --reload --port 8000
```

### **Error: GraphQL no responde en puerto 3000**
**Solución**: Verificar que Next.js está en modo desarrollo
```bash
cd Graphql_tp
npm run dev
# Acceder a: http://localhost:3000/api/graphql
```

### **Error: WebSocket desconectado**
**Solución**: Verificar que el servidor Ruby está corriendo
```bash
cd websocket_ruby
ruby server.rb
# Debe mostrar: "WebSocket server running on ws://localhost:8080"
```

### **Error: Frontend no encuentra servicios**
**Solución**: Verificar que los 3 backends están corriendo simultáneamente
- API REST: `http://localhost:8000/docs` debe abrir Swagger
- GraphQL: `http://localhost:3000/graphql-playground` debe abrir playground
- WebSocket: Consola del navegador debe mostrar "Connected to WebSocket"

---

## 📚 Documentación Técnica Detallada

### **Guías de Implementación**
- [`IMPLEMENTACION_TECNOLOGIAS.md`](./IMPLEMENTACION_TECNOLOGIAS.md) - Cómo está implementada cada tecnología backend
- [`GUIA_VISUAL.md`](./GUIA_VISUAL.md) - Qué página usa qué tecnología (con screenshots)
- [`CORRECCIONES_27_OCT.md`](./CORRECCIONES_27_OCT.md) - Últimas correcciones técnicas implementadas
- [`ANTES_DESPUES_REPORTES.md`](./ANTES_DESPUES_REPORTES.md) - Cambios visuales en CSS de Reportes

### **Arquitectura de Integración**
```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                │
│                    Puerto 5173                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ApiService.ts  │  GraphQLService.ts  │  WebSocketSvc.ts│
│       ▼         │         ▼           │        ▼        │
│   HTTP REST     │    Apollo Client    │  WebSocket API  │
└──────┬──────────┴──────────┬──────────┴────────┬────────┘
       │                     │                    │
       ▼                     ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  API REST    │    │   GraphQL    │    │  WebSocket   │
│   (Python)   │    │  (Next.js)   │    │    (Ruby)    │
│  Puerto 8000 │    │ Puerto 3000  │    │ Puerto 8080  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### **Mapeo de Páginas → Tecnologías**

| Página Frontend | API REST | GraphQL | WebSocket |
|----------------|----------|---------|-----------|
| **Dashboard.tsx** | ❌ | ✅ Stats | ❌ |
| **FilaVirtual.tsx** | ✅ CRUD | ❌ | ✅ Real-time |
| **GestionMesas.tsx** | ✅ CRUD | ❌ | ✅ Real-time |
| **Reportes.tsx** | ✅ Data | ❌ | ❌ |

---

## 👨‍💻 Desarrollo

### **Estructura de Servicios Frontend**

**`frontend/src/services/ApiService.ts`**
```typescript
// Cliente HTTP para API REST (Python FastAPI)
const API_BASE_URL = 'http://localhost:8000';
export const ApiService = {
  getFilaVirtual: () => fetch(`${API_BASE_URL}/fila-virtual/`),
  getMesas: () => fetch(`${API_BASE_URL}/mesas/`)
}
```

**`frontend/src/services/GraphQLService.ts`**
```typescript
// Cliente Apollo para GraphQL (Next.js)
import { ApolloClient, InMemoryCache } from '@apollo/client';
const client = new ApolloClient({
  uri: 'http://localhost:3000/api/graphql',
  cache: new InMemoryCache()
});
```

**`frontend/src/services/WebSocketService.ts`**
```typescript
// Cliente WebSocket nativo (Ruby EventMachine)
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Actualizar UI en tiempo real
}
```

---

## 🎓 Aprendizajes del Proyecto

### **Integración Multi-Tecnología**
- ✅ Un frontend puede consumir múltiples backends simultáneamente
- ✅ Cada tecnología tiene sus fortalezas: REST (CRUD), GraphQL (queries), WebSocket (real-time)
- ✅ Importancia de CORS y configuración de puertos

### **Arquitectura de Microservicios**
- ✅ Separación de responsabilidades por tecnología
- ✅ Cada servicio puede escalar independientemente
- ✅ Comunicación asíncrona reduce acoplamiento

### **TypeScript en Frontend**
- ✅ Tipado estático previene errores en tiempo de desarrollo
- ✅ Interfaces compartidas entre servicios mejoran mantenibilidad
- ✅ Apollo Client simplifica integración con GraphQL

---

## 📄 Licencia

Este proyecto es parte de un trabajo académico para la materia de Servidores.

**Desarrollado por**: [Tu Nombre]  
**Institución**: [Universidad/Institución]  
**Fecha**: Octubre 2024

---

## 🤝 Contribuciones

Este es un proyecto educativo. Para sugerencias o mejoras:

1. Revisa la documentación en [`IMPLEMENTACION_TECNOLOGIAS.md`](./IMPLEMENTACION_TECNOLOGIAS.md)
2. Verifica que los 3 backends estén operativos
3. Abre un issue describiendo el problema o mejora propuesta

---

**⭐ Si este proyecto te fue útil para aprender integración multi-tecnología, dale una estrella ⭐**

