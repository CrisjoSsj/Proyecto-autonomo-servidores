# 🚀 Oportunidades de Integración - 3 Tecnologías Backend

## 📊 Estado Actual de Integración

### ✅ Páginas que YA usan las 3 tecnologías:

| Página | API REST | GraphQL | WebSocket |
|--------|----------|---------|-----------|
| **Dashboard** (admin) | ❌ | ✅ Stats | ❌ |
| **FilaVirtual** (user) | ✅ CRUD | ❌ | ✅ Real-time |
| **GestionMesas** (admin) | ✅ CRUD | ❌ | ✅ Real-time |

### ⚠️ Páginas que NO usan las 3 tecnologías:

| Página | Estado Actual | Datos | Oportunidad |
|--------|---------------|-------|-------------|
| **Home** (user) | Hardcoded | Estático | 🔥 ALTA |
| **Menu** (user) | Hardcoded | Arrays estáticos | 🔥 ALTA |
| **Reservas** (user) | Solo formulario | Sin datos dinámicos | 🔥 ALTA |
| **GestionReservas** (admin) | ❌ | Sin implementar | Media |
| **GestionMenu** (admin) | ❌ | Sin implementar | Media |
| **Reportes** (admin) | ❌ | Sin implementar | Baja (ya tiene CSS) |

---

## 🔥 PRIORIDAD ALTA: Home.tsx

### 📍 Ubicación: `frontend/src/pages/user/Home.tsx`

### 🎯 Datos Hardcoded que pueden ser dinámicos:

```tsx
// ACTUAL (Hardcoded):
<div className="tarjeta-info estado-restaurante">
  <p className="detalle-info">Hoy: 11:00 AM - 10:00 PM</p>
  <p className="disponibilidad">Mesas disponibles ahora</p>
</div>

<div className="tarjeta-info tiempo-espera">
  <p className="detalle-info">Aprox. 15 minutos</p>
</div>

<div className="tarjeta-info reservas-hoy">
  <p className="horarios-libres">7:30 PM, 8:00 PM, 9:00 PM</p>
</div>

// PLATOS POPULARES (Hardcoded):
<div className="tarjeta-plato-popular">
  <h3>Alitas BBQ</h3>
  <span className="precio-popular">$8.99</span>
</div>
```

### 💡 Propuesta de Integración:

#### 1️⃣ **API REST (Python)** - Estado en tiempo real
```typescript
// Endpoint: GET /api/restaurant-status
{
  "is_open": true,
  "hours_today": "11:00 AM - 10:00 PM",
  "available_tables": 5,
  "status": "open"
}
```

#### 2️⃣ **GraphQL (Next.js)** - Platos populares y promociones
```graphql
query HomePageData {
  platosPopulares(limit: 3) {
    id
    nombre
    descripcion
    precio
    imagen_url
    ventas_totales
  }
  promocionDelDia {
    titulo
    descripcion
    condiciones
    valido_hasta
  }
}
```

#### 3️⃣ **WebSocket (Ruby)** - Cola de espera en tiempo real
```typescript
// Canal: restaurant_status
ws.onmessage = (event) => {
  const { wait_time, available_tables, queue_length } = JSON.parse(event.data);
  // Actualizar UI con tiempo de espera real
}
```

### 🛠️ Implementación Sugerida:

```tsx
// frontend/src/pages/user/Home.tsx
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { ApiService } from '../../services/ApiService';
import { WebSocketService } from '../../services/WebSocketService';
import { PLATOS_POPULARES_QUERY } from '../../graphql/queries';

export default function Home() {
  const [restaurantStatus, setRestaurantStatus] = useState(null);
  const [liveData, setLiveData] = useState({ waitTime: 15, availableTables: 5 });
  
  // GraphQL: Platos populares
  const { data: graphqlData } = useQuery(PLATOS_POPULARES_QUERY);
  
  // API REST: Estado del restaurante
  useEffect(() => {
    ApiService.getRestaurantStatus().then(setRestaurantStatus);
  }, []);
  
  // WebSocket: Datos en tiempo real
  useEffect(() => {
    const ws = WebSocketService.connect('restaurant_status');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveData({ waitTime: data.wait_time, availableTables: data.available_tables });
    };
    return () => ws.close();
  }, []);

  return (
    <div>
      {/* Estado Restaurante - API REST */}
      <div className="tarjeta-info estado-restaurante">
        <h3>Estamos {restaurantStatus?.is_open ? 'Abiertos' : 'Cerrados'}</h3>
        <p>Hoy: {restaurantStatus?.hours_today}</p>
        <p>Mesas disponibles: {liveData.availableTables}</p>
      </div>

      {/* Tiempo de espera - WebSocket LIVE */}
      <div className="tarjeta-info tiempo-espera">
        <h3>Tiempo de Espera</h3>
        <p className="live-badge">🔴 EN VIVO</p>
        <p>Aprox. {liveData.waitTime} minutos</p>
      </div>

      {/* Platos populares - GraphQL */}
      <section className="seccion-platos-populares">
        <h2>Los Más Pedidos</h2>
        <div className="tech-badge">📊 Datos desde GraphQL</div>
        {graphqlData?.platosPopulares.map(plato => (
          <div key={plato.id} className="tarjeta-plato-popular">
            <h3>{plato.nombre}</h3>
            <p>{plato.descripcion}</p>
            <span>${plato.precio}</span>
            <small>{plato.ventas_totales} vendidos este mes</small>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## 🔥 PRIORIDAD ALTA: Menu.tsx

### 📍 Ubicación: `frontend/src/pages/user/Menu.tsx`

### 🎯 Problema Actual:
- **TODO hardcoded en arrays** (100+ líneas de datos estáticos)
- Sin actualización de precios
- Sin indicador de disponibilidad

### 💡 Propuesta de Integración:

#### 1️⃣ **API REST (Python)** - CRUD de platos
```typescript
// Endpoint: GET /api/menu/platos?categoria=alitas
{
  "platos": [
    {
      "id": 1,
      "nombre": "Alitas BBQ Clásicas",
      "descripcion": "Salsa BBQ casera...",
      "precio": 8.99,
      "categoria": "alitas",
      "disponible": true,
      "tiempo_preparacion": 20
    }
  ]
}
```

#### 2️⃣ **GraphQL (Next.js)** - Estadísticas de platos
```graphql
query MenuPageData {
  categorias {
    id
    nombre
    platos {
      id
      nombre
      precio
      rating_promedio
      es_popular
      ventas_este_mes
    }
  }
}
```

#### 3️⃣ **WebSocket (Ruby)** - Disponibilidad en tiempo real
```typescript
// Canal: menu_availability
ws.onmessage = (event) => {
  const { plato_id, disponible, razon } = JSON.parse(event.data);
  // Marcar plato como "Agotado" o "Disponible"
}
```

### 🛠️ Implementación Sugerida:

```tsx
// frontend/src/pages/user/Menu.tsx
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { ApiService } from '../../services/ApiService';
import { WebSocketService } from '../../services/WebSocketService';
import { MENU_COMPLETO_QUERY } from '../../graphql/queries';

export default function Menu() {
  const [platos, setPlatos] = useState([]);
  const [availability, setAvailability] = useState({});
  
  // GraphQL: Menu completo con estadísticas
  const { data: menuData } = useQuery(MENU_COMPLETO_QUERY);
  
  // API REST: Cargar platos
  useEffect(() => {
    ApiService.getPlatos().then(setPlatos);
  }, []);
  
  // WebSocket: Disponibilidad en tiempo real
  useEffect(() => {
    const ws = WebSocketService.connect('menu_availability');
    ws.onmessage = (event) => {
      const { plato_id, disponible } = JSON.parse(event.data);
      setAvailability(prev => ({ ...prev, [plato_id]: disponible }));
    };
    return () => ws.close();
  }, []);

  return (
    <div>
      <section className="navegacion-categorias">
        <div className="tech-indicators">
          <span className="tech-badge api">🐍 API REST</span>
          <span className="tech-badge graphql">📊 GraphQL</span>
          <span className="tech-badge ws">🔴 WebSocket LIVE</span>
        </div>
      </section>

      {menuData?.categorias.map(categoria => (
        <section key={categoria.id} id={categoria.nombre}>
          <h2>{categoria.nombre}</h2>
          <div className="grilla-menu">
            {categoria.platos.map(plato => (
              <MenuCard 
                key={plato.id}
                {...plato}
                disponible={availability[plato.id] ?? true}
                esPopular={plato.es_popular}
                ventasMes={plato.ventas_este_mes}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

---

## 🔥 PRIORIDAD ALTA: Reservas.tsx

### 📍 Ubicación: `frontend/src/pages/user/Reservas.tsx`

### 🎯 Problema Actual:
- Horarios hardcoded
- Sin verificación de disponibilidad real
- Formulario no envía a backend

### 💡 Propuesta de Integración:

#### 1️⃣ **API REST (Python)** - Crear reserva
```typescript
// Endpoint: POST /api/reservas
{
  "cliente_nombre": "Juan Pérez",
  "fecha": "2024-10-28",
  "hora": "19:00",
  "personas": 4,
  "telefono": "099123456"
}
```

#### 2️⃣ **GraphQL (Next.js)** - Disponibilidad de mesas
```graphql
query DisponibilidadReservas($fecha: String!) {
  horariosDisponibles(fecha: $fecha) {
    hora
    mesas_disponibles
    capacidad_maxima
    es_premium
  }
  reservasDelDia(fecha: $fecha) {
    total
    por_hora {
      hora
      cantidad
    }
  }
}
```

#### 3️⃣ **WebSocket (Ruby)** - Notificaciones de confirmación
```typescript
// Canal: reservas_confirmation
ws.onmessage = (event) => {
  const { reservation_id, status, message } = JSON.parse(event.data);
  // Mostrar notificación de confirmación en tiempo real
}
```

### 🛠️ Implementación Sugerida:

```tsx
// frontend/src/pages/user/Reservas.tsx
import { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { ApiService } from '../../services/ApiService';
import { WebSocketService } from '../../services/WebSocketService';
import { DISPONIBILIDAD_QUERY } from '../../graphql/queries';

export default function Reservas() {
  const [selectedDate, setSelectedDate] = useState('');
  const [notification, setNotification] = useState(null);
  
  // GraphQL: Disponibilidad de horarios
  const [getDisponibilidad, { data: disponibilidad }] = useLazyQuery(DISPONIBILIDAD_QUERY);
  
  useEffect(() => {
    if (selectedDate) {
      getDisponibilidad({ variables: { fecha: selectedDate } });
    }
  }, [selectedDate]);
  
  // WebSocket: Confirmación en tiempo real
  useEffect(() => {
    const ws = WebSocketService.connect('reservas_confirmation');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotification({ type: 'success', message: data.message });
    };
    return () => ws.close();
  }, []);

  const handleSubmit = async (formData) => {
    // API REST: Crear reserva
    const result = await ApiService.createReservation(formData);
    // WebSocket enviará confirmación automáticamente
  };

  return (
    <div>
      {/* Banner con datos de GraphQL */}
      <section className="disponibilidad-realtime">
        <div className="tech-badge">📊 Disponibilidad desde GraphQL</div>
        <h3>Reservas hoy: {disponibilidad?.reservasDelDia.total}</h3>
      </section>

      {/* Horarios dinámicos desde GraphQL */}
      <div className="grilla-horarios-reservas">
        {disponibilidad?.horariosDisponibles.map(horario => (
          <span 
            key={horario.hora}
            className={`horario-item ${horario.es_premium ? 'premium' : ''} ${horario.mesas_disponibles === 0 ? 'agotado' : ''}`}
          >
            {horario.hora}
            {horario.es_premium && ' ⭐'}
            <small>{horario.mesas_disponibles} disponibles</small>
          </span>
        ))}
      </div>

      {/* Formulario envía a API REST */}
      <ReservaForm onSubmit={handleSubmit} />

      {/* Notificación en tiempo real desde WebSocket */}
      {notification && (
        <div className="notification live-notification">
          🔴 EN VIVO: {notification.message}
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Resumen de Endpoints a Crear

### 🐍 API REST (Python FastAPI) - Nuevos Endpoints

```python
# apirest_python/routers/Restaurante.py
@router.get("/restaurant-status")
async def get_restaurant_status():
    """Estado actual del restaurante"""
    return {
        "is_open": True,
        "hours_today": "11:00 AM - 10:00 PM",
        "available_tables": 5,
        "wait_time_minutes": 15
    }

# apirest_python/routers/Menu.py
@router.get("/menu/platos")
async def get_platos(categoria: str = None):
    """Obtener platos del menú"""
    # Query a DB
    pass

# apirest_python/routers/Reserva.py
@router.post("/reservas")
async def create_reserva(reserva: ReservaCreate):
    """Crear nueva reserva"""
    # Insertar en DB
    # Notificar vía WebSocket
    pass
```

### 📊 GraphQL (Next.js) - Nuevas Queries

```typescript
// Graphql_tp/lib/graphql/schema.ts
export const typeDefs = gql`
  type Query {
    # Existentes
    totalReservas: Int
    reservasPorMes: [ReservaMes]
    
    # NUEVAS
    platosPopulares(limit: Int): [Plato]
    promocionDelDia: Promocion
    horariosDisponibles(fecha: String!): [HorarioDisponible]
    reservasDelDia(fecha: String!): ReservasDelDia
    categorias: [CategoriaMenu]
  }

  type Plato {
    id: ID!
    nombre: String!
    descripcion: String
    precio: Float!
    categoria: String!
    rating_promedio: Float
    ventas_totales: Int
    es_popular: Boolean
    imagen_url: String
  }

  type CategoriaMenu {
    id: ID!
    nombre: String!
    platos: [Plato]
  }

  type HorarioDisponible {
    hora: String!
    mesas_disponibles: Int!
    capacidad_maxima: Int!
    es_premium: Boolean
  }

  type ReservasDelDia {
    total: Int!
    por_hora: [ReservaPorHora]
  }
`;
```

### 💎 WebSocket (Ruby) - Nuevos Canales

```ruby
# websocket_ruby/app/channels/restaurant_status_channel.rb
class RestaurantStatusChannel
  def self.broadcast_status
    data = {
      type: 'restaurant_status',
      wait_time: calculate_wait_time,
      available_tables: count_available_tables,
      queue_length: get_queue_length,
      timestamp: Time.now.iso8601
    }
    ConnectionManager.broadcast('restaurant_status', data)
  end
end

# websocket_ruby/app/channels/menu_availability_channel.rb
class MenuAvailabilityChannel
  def self.notify_unavailable(plato_id, razon)
    data = {
      type: 'menu_update',
      plato_id: plato_id,
      disponible: false,
      razon: razon
    }
    ConnectionManager.broadcast('menu_availability', data)
  end
end

# websocket_ruby/app/channels/reservas_channel.rb
class ReservasChannel
  def self.confirm_reservation(reservation_id, user_id)
    data = {
      type: 'reservation_confirmed',
      reservation_id: reservation_id,
      status: 'confirmed',
      message: '¡Tu reserva ha sido confirmada! Te enviamos un SMS.'
    }
    ConnectionManager.send_to_user(user_id, data)
  end
end
```

---

## 🎨 Componentes UI Sugeridos

### Badge de Tecnología (para mostrar qué backend se usa)

```tsx
// frontend/src/components/TechBadge.tsx
export function TechBadge({ type }: { type: 'rest' | 'graphql' | 'websocket' }) {
  const badges = {
    rest: { icon: '🐍', label: 'API REST', color: 'bg-blue-500' },
    graphql: { icon: '📊', label: 'GraphQL', color: 'bg-purple-500' },
    websocket: { icon: '🔴', label: 'WebSocket LIVE', color: 'bg-red-500' }
  };
  
  const badge = badges[type];
  
  return (
    <span className={`tech-badge ${badge.color} text-white px-3 py-1 rounded-full text-xs`}>
      {badge.icon} {badge.label}
    </span>
  );
}
```

### Indicador de Datos en Tiempo Real

```tsx
// frontend/src/components/LiveIndicator.tsx
export function LiveIndicator({ isLive }: { isLive: boolean }) {
  return (
    <div className="live-indicator">
      <span className={`pulse-dot ${isLive ? 'active' : ''}`}></span>
      <span className="live-text">{isLive ? 'EN VIVO' : 'Desconectado'}</span>
    </div>
  );
}
```

---

## 📊 Priorización de Implementación

### Fase 1 (2-3 días) - IMPACTO ALTO
1. ✅ **Home.tsx**: 
   - API REST: Estado restaurante
   - GraphQL: Platos populares
   - WebSocket: Tiempo espera real

2. ✅ **Menu.tsx**:
   - API REST: Cargar platos desde DB
   - GraphQL: Estadísticas y ratings
   - WebSocket: Disponibilidad real-time

### Fase 2 (2-3 días) - IMPACTO MEDIO
3. ✅ **Reservas.tsx**:
   - API REST: CRUD reservas
   - GraphQL: Disponibilidad horarios
   - WebSocket: Confirmaciones

4. ✅ **GestionReservas.tsx** (Admin):
   - API REST: Gestionar reservas
   - GraphQL: Analytics reservas
   - WebSocket: Notificaciones nuevas reservas

### Fase 3 (1-2 días) - IMPACTO BAJO
5. ⚠️ **GestionMenu.tsx** (Admin):
   - API REST: CRUD platos
   - Solo admin, menor prioridad

---

## 🎯 Beneficios de la Integración Completa

### Para el Usuario:
- ✅ Datos en tiempo real (no hardcoded)
- ✅ Información precisa de disponibilidad
- ✅ Notificaciones instantáneas
- ✅ Experiencia más profesional

### Para el Proyecto Académico:
- ✅ Demuestra dominio de 3 tecnologías
- ✅ Arquitectura real de microservicios
- ✅ Integración completa frontend-backend
- ✅ Casos de uso reales de cada tecnología

### Para el Aprendizaje:
- ✅ Entiende cuándo usar REST vs GraphQL vs WebSocket
- ✅ Manejo de estado con datos asíncronos
- ✅ Conexiones concurrentes a múltiples backends

---

## 🚀 Próximos Pasos Recomendados

1. **Crear endpoints en API REST** (Python FastAPI)
   - `GET /restaurant-status`
   - `GET /menu/platos`
   - `POST /reservas`

2. **Extender schema GraphQL** (Next.js)
   - Queries para platos populares
   - Queries para disponibilidad de reservas

3. **Agregar canales WebSocket** (Ruby)
   - `restaurant_status` channel
   - `menu_availability` channel
   - `reservas_confirmation` channel

4. **Actualizar componentes frontend**
   - Integrar servicios en Home.tsx
   - Conectar Menu.tsx a API REST
   - Implementar formulario de Reservas.tsx

¿Quieres que implemente alguna de estas integraciones ahora? 🚀
