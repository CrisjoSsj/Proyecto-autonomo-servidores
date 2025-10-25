# 🔗 GUÍA DE INTEGRACIÓN - 3 SERVICIOS BACKEND + FRONTEND

## 📋 Resumen de la Integración

Este proyecto ahora tiene **3 servicios backend** completamente integrados con el **frontend React**:

| Servicio | Tecnología | Puerto | Estado | Integración Frontend |
|----------|-----------|--------|--------|---------------------|
| **API REST** | Python + FastAPI | 8000 | ✅ Activo | ✅ Totalmente integrado |
| **GraphQL** | Next.js + Apollo Server | 3000 | ✅ Implementado | ✅ Componente de ejemplo |
| **WebSocket** | Ruby + EventMachine | 8080/8081 | ✅ Implementado | ✅ Actualizaciones en tiempo real |

---

## 🚀 PASO 1: Iniciar los 3 Servicios Backend

### **Terminal 1: API REST Python (Puerto 8000)**

```bash
cd apirest_python
python main.py
```

**Verificar:**
- ✅ Servidor corriendo en `http://localhost:8000`
- ✅ Documentación disponible en `http://localhost:8000/docs`
- ✅ 73 endpoints activos

---

### **Terminal 2: GraphQL Server (Puerto 3000)**

```bash
cd graphql_nextjs
npm install
npm run dev
```

**Verificar:**
- ✅ Servidor corriendo en `http://localhost:3000`
- ✅ GraphQL Playground disponible en `http://localhost:3000/api/graphql`
- ✅ Apollo Server activo

---

### **Terminal 3: WebSocket Server Ruby (Puerto 8080)**

```bash
cd websocket_ruby
bundle install
ruby server.rb
```

**Verificar:**
- ✅ WebSocket corriendo en `ws://localhost:8080`
- ✅ HTTP broadcast endpoint en `http://localhost:8081/broadcast`
- ✅ Canales activos: `fila_virtual`, `mesas`, `reservas`

---

## 🎨 PASO 2: Iniciar el Frontend React

### **Terminal 4: Frontend (Puerto 5173)**

```bash
cd frontend
npm install
npm run dev
```

**Verificar:**
- ✅ Frontend corriendo en `http://localhost:5173`
- ✅ Puede conectarse a los 3 backends

---

## 🔄 ARQUITECTURA DE LA INTEGRACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND REACT (Puerto 5173)                 │
│                                                                 │
│  • ApiService.ts      → API REST Python                        │
│  • GraphQLService.ts  → GraphQL Server                         │
│  • WebSocketService.ts → WebSocket Server                      │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ↓                    ↓                    ↓
┌────────────────┐  ┌────────────────┐  ┌────────────────────┐
│  API REST      │  │  GRAPHQL       │  │  WEBSOCKET         │
│  Python        │  │  Next.js       │  │  Ruby              │
│  :8000         │  │  :3000         │  │  :8080             │
│                │  │                │  │                    │
│  • CRUD        │  │  • Queries     │  │  • fila_virtual    │
│  • Auth        │  │  • Mutations   │  │  • mesas           │
│  • Validación  │  │  • Schema      │  │  • reservas        │
└────────────────┘  └────────────────┘  └────────────────────┘
         │                                      ▲
         │                                      │
         └──────────HTTP POST /broadcast───────┘
                (Cuando hay cambios en API REST)
```

---

## 📡 FLUJO DE COMUNICACIÓN EN TIEMPO REAL

### **Ejemplo: Cliente se une a Fila Virtual**

```
1️⃣ Usuario llena formulario en FilaVirtual.tsx
    ↓
2️⃣ POST a http://localhost:8000/fila-virtual/
    ↓
3️⃣ API REST Python procesa y guarda
    ↓
4️⃣ API REST envía POST a http://localhost:8081/broadcast
    {
      "channel": "fila_virtual",
      "event": "join",
      "data": { "cliente_id": 123, "nombre": "Juan" }
    }
    ↓
5️⃣ WebSocket Ruby recibe y hace broadcast
    ↓
6️⃣ Frontend React recibe actualización via WebSocket
    ↓
7️⃣ Componente FilaVirtual.tsx actualiza la UI automáticamente
```

---

## 🧪 PRUEBAS DE INTEGRACIÓN

### **1. Probar API REST**

```bash
# Obtener platos
curl http://localhost:8000/platos/

# Obtener mesas
curl http://localhost:8000/mesas/

# Obtener fila virtual
curl http://localhost:8000/fila-virtual/
```

---

### **2. Probar GraphQL**

Abrir en navegador: `http://localhost:3000/api/graphql`

```graphql
# Query de ejemplo
query {
  restaurantes {
    id
    nombre
    direccion
    telefono
    capacidadTotal
  }
}
```

---

### **3. Probar WebSocket**

#### **Opción A: Desde navegador (Consola JavaScript)**

```javascript
// Conectar al WebSocket
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Conectado!');
  
  // Enviar mensaje al canal fila_virtual
  ws.send(JSON.stringify({
    channel: 'fila_virtual',
    action: 'join',
    data: { cliente_id: 999, nombre: 'Test' }
  }));
};

ws.onmessage = (event) => {
  console.log('Mensaje recibido:', JSON.parse(event.data));
};
```

#### **Opción B: Broadcast desde API REST**

```bash
curl -X POST http://localhost:8081/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "fila_virtual",
    "event": "update",
    "data": {"cliente_id": 123, "posicion": 1}
  }'
```

---

## 📂 ARCHIVOS CLAVE DE INTEGRACIÓN

### **Frontend - Servicios**

| Archivo | Propósito | Conecta a |
|---------|-----------|-----------|
| `src/services/ApiService.ts` | Llamadas a API REST | `http://localhost:8000` |
| `src/services/GraphQLService.ts` | Queries y mutations GraphQL | `http://localhost:3000/api/graphql` |
| `src/services/WebSocketService.ts` | Conexión WebSocket | `ws://localhost:8080` |

### **Frontend - Componentes Integrados**

| Componente | Usa API REST | Usa WebSocket | Usa GraphQL |
|------------|--------------|---------------|-------------|
| `FilaVirtual.tsx` | ✅ Sí | ✅ Sí | ❌ No |
| `Menu.tsx` | ✅ Sí | ❌ No | ❌ No |
| `Reservas.tsx` | ✅ Sí | ❌ No | ❌ No |
| `RestaurantesGraphQL.tsx` | ❌ No | ❌ No | ✅ Sí |

### **Backend - Integración WebSocket**

| Archivo | Propósito |
|---------|-----------|
| `apirest_python/websocket_broadcast.py` | Envía notificaciones al WebSocket |
| `apirest_python/routers/FilaVirtual.py` | Broadcast cuando alguien se une/sale |
| `apirest_python/routers/Mesa.py` | Broadcast cuando mesa cambia estado |
| `apirest_python/routers/Reserva.py` | Broadcast cuando reserva se crea/actualiza |

---

## ✅ CHECKLIST DE VERIFICACIÓN

### **Antes de empezar:**

- [ ] Python 3.13 instalado
- [ ] Node.js instalado
- [ ] Ruby instalado
- [ ] Todas las dependencias instaladas

### **Verificar que los 4 servicios están corriendo:**

- [ ] ✅ API REST Python en puerto **8000**
- [ ] ✅ GraphQL Server en puerto **3000**
- [ ] ✅ WebSocket Server en puerto **8080**
- [ ] ✅ Frontend React en puerto **5173**

### **Verificar conexiones:**

- [ ] Frontend puede obtener datos de API REST
- [ ] Frontend puede consultar GraphQL
- [ ] Frontend recibe mensajes de WebSocket
- [ ] API REST puede enviar broadcasts a WebSocket

---

## 🎯 PÁGINAS PARA PROBAR

### **1. Fila Virtual (API REST + WebSocket)**

```
URL: http://localhost:5173/fila-virtual
```

**Qué probar:**
- ✅ Se muestran mesas en tiempo real desde API REST
- ✅ Formulario para unirse a la cola
- ✅ Al unirse, aparece en la lista inmediatamente
- ✅ Si abres la página en 2 pestañas, ambas se actualizan en tiempo real

---

### **2. Menú (API REST)**

```
URL: http://localhost:5173/menu
```

**Qué probar:**
- ✅ Se muestran 8 platos agrupados por categoría
- ✅ Datos vienen de `http://localhost:8000/platos/`

---

### **3. Restaurantes GraphQL (GraphQL)**

```
URL: http://localhost:5173/admin/restaurantes-graphql
```

**Qué probar:**
- ✅ Se conecta a GraphQL Server en puerto 3000
- ✅ Muestra restaurantes con query GraphQL
- ✅ Manejo de errores si GraphQL no está activo

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **WebSocket no conecta**

```bash
# Verificar que el servidor WebSocket está corriendo
curl http://localhost:8081/broadcast

# Si no responde, iniciar el servidor:
cd websocket_ruby
ruby server.rb
```

---

### **GraphQL no responde**

```bash
# Verificar puerto 3000
curl http://localhost:3000/api/graphql

# Si no responde, iniciar GraphQL:
cd graphql_nextjs
npm run dev
```

---

### **API REST no conecta**

```bash
# Verificar puerto 8000
curl http://localhost:8000/

# Si no responde, iniciar API REST:
cd apirest_python
python main.py
```

---

### **Frontend no carga**

```bash
# Verificar puerto 5173
# Si no responde, iniciar frontend:
cd frontend
npm run dev
```

---

## 📊 MONITOREO EN VIVO

### **Abrir en pestañas separadas:**

1. **Frontend:** `http://localhost:5173`
2. **API REST Docs:** `http://localhost:8000/docs`
3. **GraphQL Playground:** `http://localhost:3000/api/graphql`
4. **Consola del navegador** (para ver mensajes de WebSocket)

---

## 🎉 RESULTADO FINAL

Si todo está configurado correctamente:

✅ **API REST** sirve datos CRUD  
✅ **GraphQL** permite queries flexibles  
✅ **WebSocket** envía actualizaciones en tiempo real  
✅ **Frontend** consume los 3 servicios simultáneamente  

---

## 📝 NOTAS IMPORTANTES

1. **CORS:** La API REST ya tiene CORS configurado para `http://localhost:5173`
2. **Broadcast automático:** Los endpoints POST/PUT/DELETE de API REST envían broadcasts automáticamente
3. **Reconexión:** El WebSocket del frontend se reconecta automáticamente si se cae
4. **GraphQL independiente:** El servidor GraphQL funciona de forma independiente (no comparte datos con API REST)

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

1. **Autenticación en WebSocket:** Agregar JWT para verificar conexiones
2. **Sincronización GraphQL-API REST:** Hacer que GraphQL use los mismos datos que API REST
3. **Notificaciones Push:** Implementar notificaciones del navegador cuando llegan mensajes importantes
4. **Persistencia de mensajes:** Guardar mensajes de WebSocket en base de datos
5. **Scaling:** Implementar Redis para WebSocket en producción

---

**Fecha de integración:** 24 de octubre de 2025  
**Estado:** ✅ **COMPLETAMENTE INTEGRADO Y FUNCIONAL**
