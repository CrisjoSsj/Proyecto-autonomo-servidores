# MCP Tools - Chuwue Grill

## Documentación de Herramientas del Chatbot IA

El asistente de Chuwue Grill utiliza 5 herramientas MCP (Model Context Protocol) para ejecutar acciones de negocio.

---

## Herramientas de Consulta

### 1. buscar_platos

Busca platos en el menú del restaurante.

**Descripción**: Permite buscar platos por nombre, ingrediente o categoría.

**Parámetros**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `query` | string | ✅ | Texto de búsqueda |
| `categoria` | string | ❌ | Filtrar por categoría |

**Categorías válidas**: `alitas`, `hamburguesas`, `parrilladas`, `bebidas`, `postres`

**Ejemplo de uso**:

```json
{
  "tool": "buscar_platos",
  "params": {
    "query": "alitas",
    "categoria": "alitas"
  }
}
```

**Respuesta**:

```json
{
  "success": true,
  "count": 3,
  "platos": [
    {
      "id": 1,
      "nombre": "Alitas BBQ",
      "precio": 12.99,
      "categoria": "alitas",
      "descripcion": "Deliciosas alitas con salsa BBQ"
    },
    {
      "id": 2,
      "nombre": "Alitas Picantes",
      "precio": 13.99,
      "categoria": "alitas",
      "descripcion": "Alitas con salsa picante"
    }
  ],
  "message": "Encontré 3 platos"
}
```

---

### 2. ver_reserva

Consulta los detalles de una reserva existente.

**Descripción**: Obtiene información completa de una reserva por su ID.

**Parámetros**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `reserva_id` | string | ✅ | ID de la reserva |

**Ejemplo de uso**:

```json
{
  "tool": "ver_reserva",
  "params": {
    "reserva_id": "RES001"
  }
}
```

**Respuesta**:

```json
{
  "success": true,
  "reserva": {
    "id": "RES001",
    "cliente": "Juan Pérez",
    "fecha": "2026-01-15",
    "hora": "19:00",
    "personas": 4,
    "estado": "confirmada",
    "mesa": "Mesa 5",
    "notas": "Cumpleaños"
  },
  "message": "Reserva RES001 encontrada"
}
```

---

## Herramientas de Acción

### 3. crear_reserva

Crea una nueva reserva en el sistema.

**Descripción**: Permite al chatbot crear reservas para los clientes.

**Parámetros**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `cliente_nombre` | string | ✅ | Nombre del cliente |
| `fecha` | string | ✅ | Fecha (YYYY-MM-DD) |
| `hora` | string | ✅ | Hora (HH:MM) |
| `personas` | integer | ✅ | Número de personas |
| `notas` | string | ❌ | Notas adicionales |

**Ejemplo de uso**:

```json
{
  "tool": "crear_reserva",
  "params": {
    "cliente_nombre": "María García",
    "fecha": "2026-01-20",
    "hora": "20:30",
    "personas": 6,
    "notas": "Mesa cerca de la ventana"
  }
}
```

**Respuesta**:

```json
{
  "success": true,
  "reserva": {
    "id": "RESABC123",
    "cliente": "María García",
    "fecha": "2026-01-20",
    "hora": "20:30",
    "personas": 6,
    "estado": "pendiente",
    "notas": "Mesa cerca de la ventana"
  },
  "message": "¡Reserva RESABC123 creada exitosamente para María García el 2026-01-20 a las 20:30!"
}
```

---

### 4. registrar_cliente

Registra un nuevo cliente en el sistema.

**Descripción**: Agrega un cliente a la base de datos para fidelización.

**Parámetros**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `nombre` | string | ✅ | Nombre completo |
| `telefono` | string | ✅ | Número de teléfono |
| `email` | string | ❌ | Correo electrónico |

**Ejemplo de uso**:

```json
{
  "tool": "registrar_cliente",
  "params": {
    "nombre": "Carlos López",
    "telefono": "0991234567",
    "email": "carlos@email.com"
  }
}
```

**Respuesta**:

```json
{
  "success": true,
  "cliente": {
    "id": "CLI789XYZ",
    "nombre": "Carlos López",
    "email": "carlos@email.com",
    "telefono": "0991234567",
    "puntos": 0
  },
  "message": "Cliente Carlos López registrado con ID CLI789XYZ"
}
```

---

## Herramienta de Reporte

### 5. resumen_ventas

Genera estadísticas de ventas del restaurante.

**Descripción**: Proporciona un resumen de ventas para un período específico.

**Parámetros**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `periodo` | string | ✅ | Período: `dia`, `semana`, `mes` |

**Ejemplo de uso**:

```json
{
  "tool": "resumen_ventas",
  "params": {
    "periodo": "semana"
  }
}
```

**Respuesta**:

```json
{
  "success": true,
  "titulo": "Resumen de ventas de la última semana",
  "periodo": "semana",
  "fecha_inicio": "2026-01-02",
  "fecha_fin": "2026-01-09",
  "estadisticas": {
    "ventas_totales": 8547.50,
    "ordenes_completadas": 245,
    "clientes_atendidos": 196,
    "ticket_promedio": 34.89,
    "reservas_total": 73,
    "ocupacion_promedio": "78%",
    "platos_mas_vendidos": [
      {"nombre": "Alitas BBQ", "cantidad": 312},
      {"nombre": "Hamburguesa Clásica", "cantidad": 287},
      {"nombre": "Parrillada Mixta", "cantidad": 175}
    ],
    "horario_pico": "19:00 - 21:00",
    "comparacion_anterior": "+12%"
  },
  "message": "📊 Resumen de ventas de la última semana: $8547.50 en 245 órdenes"
}
```

---

## Uso desde el Chat

Los usuarios pueden invocar estas herramientas de forma natural:

| Mensaje del Usuario | Tool Invocada |
|---------------------|---------------|
| "¿Qué tienen en el menú?" | `buscar_platos` |
| "Busca alitas picantes" | `buscar_platos` |
| "Ver mi reserva RES001" | `ver_reserva` |
| "Quiero reservar mesa para 4 el viernes" | `crear_reserva` |
| "Registrarme como cliente" | `registrar_cliente` |
| "¿Cómo van las ventas hoy?" | `resumen_ventas` |

---

## Integración con el Sistema

Las herramientas se comunican internamente con:

- **Core API** (`http://localhost:8000`): Para platos, reservas y clientes
- **Base de Datos**: SQLite para almacenamiento local
- **Dashboard**: Estadísticas visuales en `/admin`

---

## Errores Comunes

| Código | Mensaje | Solución |
|--------|---------|----------|
| `AI_TOOL_NOT_FOUND` | Herramienta no encontrada | Verificar nombre del tool |
| `VALIDATION_ERROR` | Parámetros faltantes | Incluir campos requeridos |
| `NOT_FOUND` | Recurso no existe | Verificar ID |

---

*Documentación generada para Chuwue Grill - Segundo Parcial*
