# Componentes con API REST - Guía de Uso

Esta guía explica cómo usar los nuevos componentes que se conectan directamente con tu API REST de Python.

## 🚀 Componentes Disponibles

### 1. HomeSimpleAPI (`/homeapi`)
- **Descripción**: Página principal que muestra datos en tiempo real desde la API
- **Funciones**: 
  - Muestra platos destacados desde `/platos/`
  - Enlaces a todos los componentes API
  - Estado de conexión de la API

### 2. MenuConAPI (`/menuapi`)
- **Descripción**: Menú dinámico que consume datos reales
- **Funciones**:
  - Lista todos los platos desde `/platos/`
  - Organiza por categorías desde `/categorias/`
  - Filtrado y búsqueda en tiempo real

### 3. ReservasConAPI (`/reservasapi`)
- **Descripción**: Sistema completo de gestión de reservas
- **Funciones**:
  - Lista reservas existentes desde `/reservas/`
  - Formulario para crear nuevas reservas
  - Selección de clientes desde `/clientes/`
  - Selección de mesas desde `/mesas/`
  - Estados de reserva en tiempo real

### 4. FilaVirtualConAPI (`/filaapi`)
- **Descripción**: Sistema de fila virtual inteligente
- **Funciones**:
  - Lista posiciones actuales desde `/filas/`
  - Unirse a la fila virtual
  - Cálculo automático de tiempos de espera
  - Estado en tiempo real de la fila

## 📡 Conexión con API

### Configuración
Los componentes se conectan automáticamente a:
```
http://localhost:8000
```

### Endpoints Utilizados
- `GET /platos/` - Lista de platos
- `GET /categorias/` - Categorías del menú
- `GET /reservas/` - Lista de reservas
- `POST /reserva/` - Crear nueva reserva
- `GET /clientes/` - Lista de clientes
- `GET /mesas/` - Lista de mesas
- `GET /filas/` - Lista de fila virtual
- `POST /fila/` - Unirse a fila virtual

## 🛠 Cómo Iniciar el Sistema

### 1. Iniciar API REST (Python)
```powershell
cd apirest_python
python main.py
```
La API correrá en `http://localhost:8000`

### 2. Iniciar Frontend (React)
```powershell
cd frontend
npm run dev
```
El frontend correrá en `http://localhost:5173`

### 3. Acceder a los Componentes
- Home API: `http://localhost:5173/homeapi`
- Menú API: `http://localhost:5173/menuapi`
- Reservas API: `http://localhost:5173/reservasapi`
- Fila Virtual API: `http://localhost:5173/filaapi`

## ⚡ Estado de la Conexión

### Indicadores Visuales
Todos los componentes muestran:
- ✅ **API Conectada**: Conexión exitosa
- ⏳ **Cargando**: Estableciendo conexión
- ❌ **Error**: Problema de conexión

### Solución de Problemas
Si ves errores de conexión:
1. Verifica que la API Python esté ejecutándose
2. Confirma el puerto `8000` disponible
3. Revisa la consola del navegador para detalles

## 🎯 Funcionalidades Principales

### Datos en Tiempo Real
- Los componentes se actualizan automáticamente
- Cambios en la API se reflejan inmediatamente
- Sin necesidad de recargar página

### Manejo de Errores
- Mensajes claros de error
- Botones de reintento
- Estados de carga informativos

### Validación de Datos
- Formularios con validación en frontend
- Validación adicional en API con Pydantic
- Mensajes de éxito y error

## 🔧 Estructura de Datos

### Reserva
```typescript
{
  id_reserva: number,
  id_cliente: number,
  id_mesa: number,
  fecha: string,
  hora_inicio: string,
  hora_fin: string,
  estado: string
}
```

### FilaVirtual
```typescript
{
  id_fila: number,
  id_cliente: number,
  posicion: number,
  tiempo_espera: string,
  estado: string
}
```

## 📝 Próximos Pasos

Para extender la funcionalidad:

1. **Autenticación**: Integrar login real con JWT
2. **WebSockets**: Conectar con servidor Ruby para updates en tiempo real
3. **Notificaciones**: Sistema de alertas para cambios de estado
4. **Dashboard Admin**: Panel para gestionar reservas y fila

## 🐛 Debugging

### Consola del Navegador
Activa las herramientas de desarrollo (F12) para ver:
- Logs de conexión API
- Errores de red
- Datos recibidos de la API

### Logs del Servidor
La API Python muestra logs útiles:
- Peticiones HTTP recibidas
- Errores de validación
- Estado de CORS

¡Tu sistema de restaurante ahora está completamente conectado con datos reales!