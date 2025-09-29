# 🔧 Backend - Chuwue Grill

Backend del sistema integral de restaurante **Chuwue Grill**, desarrollado con **TypeScript** y **Node.js**. Implementa la lógica de negocio y servicios para la gestión completa del restaurante.

## 🚀 Tecnologías y Herramientas

- **Node.js** - Runtime de JavaScript para el servidor
- **TypeScript 5.8.3** - Tipado estático con configuración estricta
- **ts-node-dev 2.0.0** - Herramienta de desarrollo con hot reload
- **Arquitectura por Capas** - Separación clara entre dominio y servicios
- **Interfaces TypeScript** - Contratos bien definidos para todas las entidades

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── dominio/                   # Entidades y contratos del negocio
│   │   ├── CategoriaMenu.ts       # Interface para categorías del menú
│   │   ├── Cliente.ts             # Interface para clientes del restaurante
│   │   ├── FilaVirtual.ts         # Interface para sistema de cola virtual
│   │   ├── Menu.ts                # Interface para menús del restaurante
│   │   ├── Mesa.ts                # Interface para mesas y su estado
│   │   ├── Plato.ts               # Interface para platos del menú
│   │   ├── Reserva.ts             # Interface para reservas de clientes
│   │   └── Restaurante.ts         # Interface principal del restaurante
│   ├── service/                   # Servicios de lógica de negocio
│   │   ├── CategoriaService.ts    # Gestión de categorías del menú
│   │   ├── clineteService.ts      # Gestión de clientes (CRUD completo)
│   │   ├── filaService.ts         # Sistema avanzado de fila virtual
│   │   ├── MenuService.ts         # Gestión de menús del restaurante
│   │   ├── MesaService.ts         # Control de mesas y ocupación
│   │   ├── platoService.ts        # Gestión de platos y disponibilidad
│   │   ├── reservaService.ts      # Sistema de reservas completo
│   │   └── restauranteService.ts  # Gestión principal del restaurante
│   └── app.ts                     # Aplicación principal y punto de entrada
├── package.json                   # Dependencias y scripts del proyecto
├── tsconfig.json                  # Configuración estricta de TypeScript
└── dist/                          # Archivos compilados (generado)
```

## 🏗️ Arquitectura del Sistema

### **📋 Capa de Dominio**
Define las interfaces y contratos principales del negocio:

#### **🏢 Restaurante (Restaurante.ts)**
```typescript
interface IRestaurante {
  id_restaurante: number;
  nombre: string;
  direccion: string;
  telefono: string;
  mesas: IMesa[];
  reservas: IReserva[];
  menu: IMenu;
}
```

#### **👥 Cliente (Cliente.ts)**
```typescript
interface ICliente {
  id_cliente: number;
  nombre: string;
  correo: string;
  telefono: string;
}
```

#### **🍽️ Mesa (Mesa.ts)**
```typescript
interface IMesa {
  id_mesa: number;
  numero: string;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada';
}
```

#### **📅 Reserva (Reserva.ts)**
```typescript
interface IReserva {
  id_reserva: number;
  id_cliente: number;
  id_mesa: number;
  fecha: Date;
  hora_inicio: Date;
  hora_fin: Date;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'finalizada';
  cliente?: ICliente;
  mesa?: IMesa;
}
```

#### **⏳ Fila Virtual (FilaVirtual.ts)**
```typescript
interface IFilaVirtual {
  id_fila: number;
  id_cliente: number;
  posicion: number;
  estado: 'esperando' | 'notificado' | 'asignado' | 'cancelado';
  cliente?: ICliente;
}
```

### **⚙️ Capa de Servicios**
Implementa toda la lógica de negocio con operaciones completas CRUD:

## 🛠️ Servicios Implementados

### **👥 ClienteService**
**Funcionalidades:**
- ✅ Agregar nuevos clientes al sistema
- ✅ Obtener lista completa de clientes registrados
- ✅ Buscar clientes por ID específico
- ✅ Actualizar información de clientes existentes
- ✅ Eliminar clientes del sistema

**Métodos Principales:**
```typescript
- agregarCliente(cliente: ICliente): void
- obtenerClientes(): ICliente[]
- buscarClientePorId(id: number): ICliente | undefined
- actualizarCliente(id: number, datos: Partial<ICliente>): void
- eliminarCliente(id: number): void
```

### **🍽️ MesaService**
**Funcionalidades:**
- ✅ Crear y gestionar mesas del restaurante
- ✅ Control de estados: libre, ocupada, reservada
- ✅ Asignación y liberación de mesas
- ✅ Consulta de disponibilidad en tiempo real
- ✅ Gestión de capacidad por mesa

**Métodos Principales:**
```typescript
- agregarMesa(mesa: Omit<IMesa, 'id_mesa'>): IMesa
- obtenerMesas(): IMesa[]
- buscarMesaPorId(id: number): IMesa | undefined
- actualizarMesa(id: number, datos: Partial<IMesa>): void
- eliminarMesa(id: number): void
```

### **📅 ReservaService**
**Funcionalidades:**
- ✅ Crear reservas con validación de fechas
- ✅ Estados de reserva: pendiente, confirmada, cancelada, finalizada
- ✅ Gestión de horarios y disponibilidad
- ✅ Asociación con clientes y mesas
- ✅ Historial completo de reservas

**Métodos Principales:**
```typescript
- agregarReserva(reserva: Omit<IReserva, 'id_reserva'>): IReserva
- obtenerReservas(): IReserva[]
- buscarReservaPorId(id: number): IReserva | undefined
- actualizarReserva(id: number, datos: Partial<IReserva>): void
- eliminarReserva(id: number): void
```

### **⏳ FilaService (Sistema Avanzado)**
**Funcionalidades Principales:**
- ✅ **Gestión de Cola Virtual**: Registro automático de clientes en espera
- ✅ **Control de Posiciones**: Actualización automática de posiciones en la fila
- ✅ **Estados Dinámicos**: esperando → notificado → asignado → cancelado
- ✅ **Notificaciones**: Sistema para alertar al siguiente cliente
- ✅ **Asignación de Mesas**: Proceso automatizado de asignación
- ✅ **Cancelación de Fila**: Salida voluntaria o por timeout
- ✅ **Analytics de Cola**: Estadísticas y tiempos de espera

**Métodos Avanzados:**
```typescript
// Operaciones CRUD básicas
- agregarFila(fila: Omit<IFilaVirtual, 'id_fila' | 'posicion'>): IFilaVirtual
- obtenerFilas(): IFilaVirtual[]
- eliminarFila(id: number): void
- actualizarFila(id: number, datos: Partial<IFilaVirtual>): void

// Funcionalidades avanzadas de fila virtual
- notificarSiguienteCliente(): IFilaVirtual | undefined
- asignarMesaACliente(id_fila: number): boolean
- cancelarFila(id_fila: number): boolean
- obtenerFilasPorEstado(estado: 'esperando' | 'notificado' | 'asignado' | 'cancelado'): IFilaVirtual[]
- obtenerPosicionEnFila(id_fila: number): number | undefined
- obtenerTiempoEstimadoEspera(id_fila: number, tiempoPromedio: number): number | undefined
- limpiarFilasCanceladasOAsignadas(): void
- reiniciarFila(): void

// Analytics y estadísticas
- obtenerTotalFilas(): number
- obtenerTotalFilasPorEstado(estado: IFilaVirtual['estado']): number
- obtenerFilaPorCliente(id_cliente: number): IFilaVirtual | undefined
```

### **🍕 PlatoService**
**Funcionalidades:**
- ✅ Gestión completa de platos del menú
- ✅ Control de disponibilidad y stock
- ✅ Asociación con categorías de menú
- ✅ Gestión de precios dinámicos
- ✅ Estados de productos (disponible/agotado)

**Métodos Principales:**
```typescript
- agregarPlato(plato: IPlato): void
- obtenerPlatos(): IPlato[]
- buscarPlatoPorId(id: number): IPlato | undefined
- actualizarPlato(id: number, datos: Partial<IPlato>): void
- eliminarPlato(id: number): void
```

### **🏷️ CategoriaService**
**Funcionalidades:**
- ✅ Creación y gestión de categorías del menú
- ✅ Organización jerárquica de platos
- ✅ Sistema de identificación único
- ✅ Operaciones CRUD completas

**Métodos Principales:**
```typescript
- agregarCategoria(categoria: Omit<ICategoriaMenu, 'id_categoria'>): ICategoriaMenu
- obtenerCategorias(): ICategoriaMenu[]
- buscarCategoriaPorId(id: number): ICategoriaMenu | undefined
- actualizarCategoria(id: number, datos: Partial<ICategoriaMenu>): void
- eliminarCategoria(id: number): void
```

### **📋 MenuService**
**Funcionalidades:**
- ✅ Gestión de menús por fecha
- ✅ Asociación de platos con menús
- ✅ Control de menús activos
- ✅ Historial de menús pasados

**Métodos Principales:**
```typescript
- agregarMenu(menu: Omit<IMenu, 'id_menu'>): IMenu
- obtenerMenus(): IMenu[]
- buscarMenuPorId(id: number): IMenu | undefined
- actualizarMenu(id: number, datos: Partial<IMenu>): void
- eliminarMenu(id: number): void
```

### **🏢 RestauranteService**
**Funcionalidades:**
- ✅ Gestión principal del restaurante
- ✅ Configuración central del negocio
- ✅ Coordinación entre todos los servicios

**Métodos Principales:**
```typescript
- crear(restaurante: Omit<IRestaurante, 'id_restaurante'>): IRestaurante
- obtenerPorId(id: number): IRestaurante | undefined
- actualizar(id: number, datos: Partial<IRestaurante>): IRestaurante | undefined
```

## 🎯 Funcionalidades Destacadas

### **⚡ Sistema de Fila Virtual Avanzado**
El `FilaService` implementa un sistema completo de cola virtual con:

1. **Registro Automático**: Los clientes se registran automáticamente en la fila
2. **Gestión de Posiciones**: Actualización automática cuando alguien sale de la fila
3. **Estados Progresivos**: 
   - `esperando` → Cliente en cola
   - `notificado` → Cliente notificado para pasar
   - `asignado` → Mesa asignada
   - `cancelado` → Cliente salió de la fila
4. **Notificaciones Inteligentes**: Sistema para alertar al siguiente cliente
5. **Analytics**: Estadísticas completas de la cola y tiempos de espera

### **🔄 Gestión de Estados**
Todas las entidades manejan estados bien definidos:
- **Mesas**: libre, ocupada, reservada
- **Reservas**: pendiente, confirmada, cancelada, finalizada
- **Fila Virtual**: esperando, notificado, asignado, cancelado

### **🛡️ TypeScript Estricto**
Configuración TypeScript con máxima seguridad:
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "isolatedModules": true,
  "moduleDetection": "force"
}
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo con Hot Reload
npm run dev          # Ejecuta app.ts con ts-node-dev y recarga automática

# Construcción
npm run build        # Compila TypeScript a JavaScript en dist/

# Producción
npm run start        # Compila y ejecuta la versión de producción

# Testing
npm test            # Ejecuta las pruebas (pendiente de implementar)
```

## 📦 Dependencias

### **Dependencias de Desarrollo**
- `ts-node-dev@2.0.0` - Herramienta de desarrollo con hot reload para TypeScript

### **Dependencias Futuras (Recomendadas)**
- `express` - Framework web para crear API REST
- `cors` - Middleware para CORS
- `helmet` - Seguridad HTTP
- `morgan` - Logger de peticiones HTTP
- `joi` o `zod` - Validación de datos
- `jsonwebtoken` - Autenticación JWT
- `bcrypt` - Hashing de contraseñas

## ⚡ Instalación y Desarrollo

### **Instalación**
```bash
# Navegar al backend
cd backend

# Instalar dependencias
npm install
```

### **Desarrollo Local**
```bash
# Modo desarrollo con hot reload
npm run dev

# El servidor TypeScript se ejecutará con recarga automática
# Cualquier cambio en src/ reiniciará automáticamente la aplicación
```

### **Construcción**
```bash
# Compilar TypeScript a JavaScript
npm run build

# Los archivos compilados estarán en dist/
```

### **Producción**
```bash
# Compilar y ejecutar en producción
npm run start
```

## 🧪 Pruebas de Funcionamiento

### **Ejemplo de Uso (app.ts)**
```typescript
import { ClienteService } from "./service/clineteService";

const clienteService = new ClienteService();

// Agregar cliente
clienteService.agregarCliente({
    id_cliente: 1,
    nombre: "Juan",
    correo: "Perez@gmail.co",
    telefono: "123456789"
});

// Obtener y mostrar clientes
clienteService.obtenerClientes().forEach((cliente) => {
    console.log(`ID: ${cliente.id_cliente}, Nombre: ${cliente.nombre}, Correo: ${cliente.correo}, Teléfono: ${cliente.telefono}`);
});
```

### **Ejecutar Prueba**
```bash
npm run dev
# Salida: ID: 1, Nombre: Juan, Correo: Perez@gmail.co, Teléfono: 123456789
```

## 🔮 Próximas Mejoras

### **API REST (Prioritario)**
- [ ] **Express.js**: Implementar servidor HTTP con endpoints REST
- [ ] **Rutas CRUD**: Endpoints para todos los servicios implementados
- [ ] **Middleware**: Validación, autenticación, logging
- [ ] **Documentación API**: Swagger/OpenAPI para documentar endpoints

### **Persistencia de Datos**
- [ ] **Base de Datos**: Integración con MongoDB o PostgreSQL
- [ ] **ORM/ODM**: Mongoose para MongoDB o Prisma para SQL
- [ ] **Migraciones**: Sistema de migraciones de base de datos
- [ ] **Seeders**: Datos iniciales para desarrollo y testing

### **Seguridad y Autenticación**
- [ ] **JWT**: Sistema de autenticación con JSON Web Tokens
- [ ] **Roles y Permisos**: Sistema de autorización (admin, empleado)
- [ ] **Validación**: Validación robusta de datos de entrada
- [ ] **Rate Limiting**: Límites de peticiones por IP

### **Funcionalidades Avanzadas**
- [ ] **WebSockets**: Notificaciones en tiempo real para fila virtual
- [ ] **Notificaciones**: Sistema de notificaciones push
- [ ] **Logs**: Sistema de logging robusto con Winston
- [ ] **Métricas**: Monitoreo y analytics del sistema
- [ ] **Caching**: Redis para cachear datos frecuentes

### **Testing y Calidad**
- [ ] **Pruebas Unitarias**: Jest para testing de servicios
- [ ] **Pruebas de Integración**: Testing de APIs completas
- [ ] **Cobertura**: Reporte de cobertura de código
- [ ] **CI/CD**: Pipeline de integración continua

### **DevOps y Deployment**
- [ ] **Docker**: Containerización de la aplicación
- [ ] **Docker Compose**: Orquestación con base de datos
- [ ] **Variables de Entorno**: Configuración por entornos
- [ ] **Health Checks**: Endpoints de salud para monitoreo

## 📈 Métricas del Proyecto

### **Estadísticas de Código**
- **Total de Interfaces**: 8 interfaces de dominio bien definidas
- **Total de Servicios**: 8 servicios con lógica completa
- **Métodos Implementados**: ~60+ métodos entre todos los servicios
- **Cobertura TypeScript**: 100% tipado estático
- **Arquitectura**: Separación clara entre dominio y servicios

### **Complejidad por Servicio**
- 🟢 **Simple**: ClienteService, MesaService, PlatoService (CRUD básico)
- 🟡 **Intermedio**: ReservaService, MenuService, CategoriaService (lógica de negocio)
- 🔴 **Avanzado**: FilaService (sistema complejo con estados y notificaciones)

### **Preparación para Escalabilidad**
- ✅ **Arquitectura Modular**: Servicios independientes y reutilizables
- ✅ **Interfaces Bien Definidas**: Contratos claros entre capas
- ✅ **TypeScript Estricto**: Prevención de errores en tiempo de compilación
- ✅ **Patrón de Servicios**: Fácil extensión y mantenimiento

---

> 💡 **Nota**: Este backend implementa toda la lógica de negocio necesaria para el restaurante, pero actualmente funciona en memoria. Para un sistema completo de producción, se requiere implementar API REST, base de datos y autenticación.