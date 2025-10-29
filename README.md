# 🍗 Chuwue Grill - Sistema Integral de Restaurante

## 🏗️ Arquitectura de Microservicios

Sistema completo de gestión para el restaurante **Chuwue Grill** implementado con arquitectura de microservicios y múltiples tecnologías modernas. Proyecto desarrollado como trabajo autónomo siguiendo los requisitos de distribución de lenguajes de programación.

### 🎯 Distribución de Componentes por Lenguaje

- **🐍 Python (API REST)** - Servicio principal con CRUD completo y autenticación JWT
- **💎 Ruby (WebSocket Server)** - Servidor de tiempo real para notificaciones y updates  
- **⚡ TypeScript (Backend + Frontend)** - Servicios de dominio y interfaz de usuario React

Aplicación web completa para la gestión integral del restaurante **Chuwue Grill**. Incluye interfaz de cliente para consultas y reservas, más un completo panel de administración para la gestión operativa del restaurante.

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

### 🐍 **API REST (Python)**
- **FastAPI** - Framework web moderno y de alto rendimiento
- **Pydantic** - Validación de datos y serialización
- **JWT** - Autenticación y autorización segura
- **Passlib + Bcrypt** - Hashing seguro de contraseñas
- **Uvicorn** - Servidor ASGI de alto rendimiento

### 💎 **WebSocket Server (Ruby)**
- **Ruby** - Lenguaje de programación dinámico y expresivo
- **WebSocket** - Comunicación bidireccional en tiempo real
- **EventMachine** - Programación asíncrona y manejo de eventos
- **JSON** - Intercambio de datos estructurados

### ⚡ **Backend Services (TypeScript)**
- **TypeScript** - Tipado estático para JavaScript
- **Domain-Driven Design** - Arquitectura de dominio bien estructurada
- **Interfaces** - Contratos claros entre componentes

### 🎨 **Frontend (React + TypeScript)**
- **React 19** - Framework principal para interfaces de usuario
- **Vite** - Build tool moderno y servidor de desarrollo ultra-rápido
- **TypeScript** - Tipado estático para JavaScript (archivos .tsx)
- **React Router DOM** - Enrutamiento SPA para navegación fluida
- **Tailwind CSS** - Framework de CSS utilitario para diseño responsive
- **ESLint** - Linter para mantener calidad del código


## 📁 Estructura del Proyecto

```
Proyecto-autonomo-servidores/
├── 🐍 apirest_python/         # API REST Principal (Python + FastAPI)
│   ├── routers/               # Endpoints organizados por entidad
│   │   ├── auth.py           # Autenticación JWT
│   │   ├── user.py           # Gestión de usuarios
│   │   ├── Restaurante.py    # CRUD de restaurantes
│   │   ├── Cliente.py        # CRUD de clientes
│   │   ├── Mesa.py           # Gestión de mesas
│   │   ├── Reserva.py        # Sistema de reservas
│   │   ├── Menu.py           # Gestión de menús
│   │   ├── Plato.py          # CRUD de platos
│   │   ├── CategoriaMenu.py  # Categorías de menú
│   │   └── FilaVirtual.py    # Cola virtual de espera
│   ├── main.py               # Aplicación principal FastAPI
│   ├── requirements.txt      # Dependencias Python
│   └── .venv/               # Entorno virtual Python
│
├── 💎 websocket_ruby/         # Servidor WebSocket (Ruby)
│   ├── app/
│   │   ├── channels/         # Canales de comunicación
│   │   │   ├── fila_virtual_channel.rb    # Canal de fila virtual
│   │   │   ├── mesas_channel.rb           # Canal de mesas
│   │   │   └── reservas_channel.rb        # Canal de reservas
│   │   ├── connections/      # Gestión de conexiones
│   │   │   └── connection_manager.rb
│   │   └── utils/           # Utilidades
│   │       └── message_builder.rb
│   ├── server.rb            # Servidor principal WebSocket
│   ├── Gemfile              # Dependencias Ruby
│   └── Gemfile.lock
│
├── ⚡ backend/               # Servicios de Dominio (TypeScript)
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
- **Node.js 16+** para TypeScript backend y React frontend

### **🐍 Configuración API REST (Python)**
```bash
cd apirest_python
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### **💎 Configuración WebSocket Server (Ruby)**
```bash
cd websocket_ruby
bundle install
ruby server.rb
```

### **⚡ Configuración Backend Services (TypeScript)**
```bash
cd backend
npm install
npm run build
npm start
```

### **🎨 Configuración Frontend (React)**
```bash
cd frontend
npm install
npm run dev
```

### **🌐 URLs de Acceso**
- **API REST**: `http://localhost:8000` (Swagger: `/docs`)
- **WebSocket Server**: `ws://localhost:3001`
- **Backend Services**: `http://localhost:3000`
- **Frontend**: `http://localhost:5173`

## 🎯 Estado del Proyecto

### **✅ Componentes Completados**

#### **🐍 API REST (Python + FastAPI)**
- [x] **CRUD Completo** - 9 entidades con operaciones completas
- [x] **Autenticación JWT** - Sistema seguro de login y tokens
- [x] **Validación de Datos** - Pydantic models con validación automática
- [x] **Manejo de Errores** - HTTPException en todos los endpoints
- [x] **Documentación Automática** - Swagger UI y ReDoc
- [x] **Estructura Modular** - Routers organizados por entidad

#### **💎 WebSocket Server (Ruby)**
- [x] **Servidor WebSocket** - Comunicación en tiempo real
- [x] **Canales Especializados** - Fila virtual, mesas y reservas
- [x] **Gestión de Conexiones** - Connection manager robusto
- [x] **Message Builder** - Construcción de mensajes estructurados
- [x] **Event Handling** - Manejo de eventos del restaurante

#### **⚡ Backend Services (TypeScript)**
- [x] **Arquitectura de Dominio** - Entidades bien definidas
- [x] **Servicios de Aplicación** - 8 servicios con lógica de negocio
- [x] **Tipado Estricto** - TypeScript con configuración robusta
- [x] **Patrón Repository** - Separación de responsabilidades
- [x] **Domain-Driven Design** - Arquitectura limpia y mantenible

#### **🎨 Frontend (React + TypeScript)**
- [x] **Interfaz de Usuario Completa** - 4 páginas de cliente
- [x] **Panel de Administración** - 5 páginas de gestión
- [x] **Sistema de Rutas** - React Router con navegación
- [x] **Diseño Responsive** - Optimizado para todos los dispositivos
- [x] **Componentes Modulares** - Reutilizables y organizados

### **🏗️ Arquitectura de Integración**
- [x] **Microservicios Distribuidos** - Cada componente independiente
- [x] **Comunicación REST** - API endpoints para operaciones CRUD
- [x] **Comunicación WebSocket** - Updates en tiempo real
- [x] **Tipado Compartido** - Interfaces consistentes entre servicios
- [x] **Separación de Responsabilidades** - Cada lenguaje en su dominio

### **🔄 Mejoras Futuras**
- [ ] **Integración Completa** - Conectar todos los microservicios
- [ ] **Base de Datos** - Persistencia con PostgreSQL/MongoDB
- [ ] **Docker Compose** - Orquestación de contenedores
- [ ] **Testing Integrado** - Pruebas end-to-end
- [ ] **CI/CD Pipeline** - Deployment automatizado
- [ ] **Monitoreo** - Logs y métricas centralizadas

