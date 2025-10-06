# 💎 WebSocket Server - Chuwue Grill

Servidor WebSocket desarrollado en **Ruby** para proporcionar comunicación en tiempo real entre el backend y el frontend del sistema de restaurante. Maneja notificaciones, actualizaciones de estado y eventos del restaurante en tiempo real.

## 🎯 Características Principales

### **⚡ Comunicación en Tiempo Real**
- **WebSocket Server** bidireccional para updates instantáneos
- **Event-driven Architecture** para manejo eficiente de eventos
- **Multi-channel Support** con canales especializados
- **Connection Management** robusto con reconexión automática

### **📡 Canales Especializados**
- **Fila Virtual** - Actualizaciones de posición en cola de espera
- **Mesas** - Estados de mesas (ocupada, libre, reservada, limpieza)
- **Reservas** - Notificaciones de nuevas reservas y cambios

### **🔧 Funcionalidades Técnicas**
- **Message Broadcasting** a clientes específicos o grupos
- **Event Filtering** por tipo de usuario y permisos
- **JSON Message Format** para intercambio estructurado de datos
- **Error Handling** con reconexión automática

## 🏗️ Arquitectura

### **Estructura de Archivos**
```
websocket_ruby/
├── app/
│   ├── channels/                   # Canales de comunicación especializados
│   │   ├── fila_virtual_channel.rb # 🔄 Canal de fila virtual
│   │   ├── mesas_channel.rb        # 🪑 Canal de estados de mesas  
│   │   └── reservas_channel.rb     # 📅 Canal de reservas
│   ├── connections/                # Gestión de conexiones WebSocket
│   │   └── connection_manager.rb   # 🔗 Manager de conexiones
│   └── utils/                      # Utilidades y helpers
│       └── message_builder.rb      # 📨 Constructor de mensajes
├── server.rb                       # 🚀 Servidor principal WebSocket
├── Gemfile                         # 💎 Dependencias Ruby
├── Gemfile.lock                    # 🔒 Versiones fijas de dependencias
└── README.md                       # 📖 Esta documentación
```

### **Patrón de Diseño**
- **Channel Pattern** - Canales separados por dominio de negocio
- **Observer Pattern** - Notificación automática a subscribers
- **Message Queue** - Cola de mensajes para delivery confiable
- **Connection Pool** - Gestión eficiente de conexiones múltiples

## 🔧 Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **Ruby 3.0+** | Lenguaje de programación principal |
| **WebSocket** | Protocolo de comunicación bidireccional |
| **EventMachine** | Reactor pattern para I/O asíncrono |
| **JSON** | Formato de intercambio de datos |
| **Socket.IO** | Biblioteca WebSocket con fallbacks |

## 🚀 Instalación y Configuración

### **1. Prerrequisitos**
- Ruby 3.0 o superior
- Bundler (gestor de gems)

### **2. Configuración del Entorno**
```bash
# Navegar al directorio del WebSocket server
cd websocket_ruby

# Instalar dependencias
bundle install

# Configurar variables de entorno (opcional)
export WEBSOCKET_PORT=3001
export WEBSOCKET_HOST=localhost
```

### **3. Ejecutar el Servidor**
```bash
# Servidor de desarrollo
ruby server.rb

# Servidor con logging detallado
ruby server.rb --verbose

# Servidor en puerto específico
ruby server.rb --port 3002
```

### **4. Verificar Conexión**
```bash
# Test de conexión con wscat (instalar: npm install -g wscat)
wscat -c ws://localhost:3001

# O usar curl para WebSocket handshake
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
     http://localhost:3001/
```

## 📡 Canales de Comunicación

### **🔄 Fila Virtual Channel**
**Propósito**: Gestionar la cola de espera virtual de clientes

**Eventos que maneja**:
- `cliente_agregado` - Nuevo cliente entra a la fila
- `cliente_llamado` - Cliente es llamado a mesa
- `cliente_removido` - Cliente abandona la fila
- `posicion_actualizada` - Cambio de posición en la fila
- `tiempo_estimado` - Actualización de tiempo de espera

**Formato de mensaje**:
```ruby
{
  channel: "fila_virtual",
  event: "cliente_agregado",
  data: {
    cliente_id: 123,
    nombre: "Juan Pérez",
    posicion: 3,
    tiempo_estimado: "15 minutos"
  },
  timestamp: "2024-10-06T10:30:00Z"
}
```

### **🪑 Mesas Channel**
**Propósito**: Monitorear estados de mesas en tiempo real

**Eventos que maneja**:
- `mesa_ocupada` - Mesa cambia a estado ocupado
- `mesa_liberada` - Mesa queda disponible
- `mesa_reservada` - Mesa se reserva
- `mesa_limpieza` - Mesa en proceso de limpieza
- `mesa_disponible` - Mesa lista para nuevos clientes

**Formato de mensaje**:
```ruby
{
  channel: "mesas",
  event: "mesa_ocupada",
  data: {
    mesa_id: 5,
    numero: 5,
    capacidad: 4,
    estado_anterior: "disponible",
    estado_actual: "ocupada",
    cliente_id: 456
  },
  timestamp: "2024-10-06T10:35:00Z"
}
```

### **📅 Reservas Channel**
**Propósito**: Notificaciones de reservas y eventos especiales

**Eventos que maneja**:
- `reserva_creada` - Nueva reserva realizada
- `reserva_confirmada` - Reserva confirmada por el restaurante
- `reserva_cancelada` - Reserva cancelada
- `reserva_recordatorio` - Recordatorio de reserva próxima
- `evento_especial` - Eventos corporativos o especiales

**Formato de mensaje**:
```ruby
{
  channel: "reservas",
  event: "reserva_creada",
  data: {
    reserva_id: 789,
    cliente: {
      id: 123,
      nombre: "María García",
      telefono: "555-0123"
    },
    mesa_id: 8,
    fecha: "2024-10-10",
    hora_inicio: "19:00",
    hora_fin: "21:00",
    personas: 6,
    ocasion: "Cumpleaños"
  },
  timestamp: "2024-10-06T11:00:00Z"
}
```

## 🔗 Connection Manager

### **Gestión de Conexiones**
```ruby
class ConnectionManager
  # Registrar nueva conexión
  def register_connection(socket, user_type = :client)
  
  # Desregistrar conexión
  def unregister_connection(socket)
  
  # Broadcast a todos los clientes
  def broadcast_all(message)
  
  # Broadcast a tipo específico de usuario
  def broadcast_to_type(message, user_type)
  
  # Enviar mensaje a conexión específica
  def send_to_connection(socket, message)
end
```

### **Tipos de Usuario**
- `:client` - Clientes del restaurante (fila virtual, reservas)
- `:admin` - Personal administrativo (todas las notificaciones)
- `:waiter` - Meseros (estados de mesas, órdenes)
- `:kitchen` - Cocina (órdenes, platos listos)

## 📨 Message Builder

### **Constructor de Mensajes**
```ruby
class MessageBuilder
  # Crear mensaje estándar
  def self.build_message(channel, event, data)
    {
      channel: channel,
      event: event,
      data: data,
      timestamp: Time.now.utc.iso8601
    }.to_json
  end
  
  # Mensaje de error
  def self.error_message(error_code, description)
    build_message("system", "error", {
      code: error_code,
      message: description
    })
  end
  
  # Mensaje de confirmación
  def self.ack_message(original_event)
    build_message("system", "ack", {
      original_event: original_event,
      status: "received"
    })
  end
end
```

## 🧪 Testing del WebSocket

### **Cliente JavaScript (Frontend)**
```javascript
// Conectar al WebSocket
const ws = new WebSocket('ws://localhost:3001');

// Escuchar mensajes
ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log(`Canal: ${message.channel}, Evento: ${message.event}`, message.data);
};

// Enviar mensaje al servidor
ws.send(JSON.stringify({
    channel: 'fila_virtual',
    action: 'subscribe',
    client_id: 123
}));
```

### **Cliente Ruby (Testing)**
```ruby
require 'websocket-client-simple'

ws = WebSocket::Client::Simple.connect 'ws://localhost:3001'

ws.on :message do |msg|
  data = JSON.parse(msg.data)
  puts "Recibido: #{data['channel']} - #{data['event']}"
end

ws.on :open do
  puts "Conectado al WebSocket server"
  # Suscribirse a canal
  ws.send({
    channel: 'mesas',
    action: 'subscribe'
  }.to_json)
end
```

### **Testing con curl**
```bash
# Test de handshake WebSocket
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
     http://localhost:3001/
```

## 📊 Monitoreo y Logs

### **Logs del Servidor**
```ruby
# Configuración de logging
require 'logger'

logger = Logger.new(STDOUT)
logger.level = Logger::INFO

# Logs automáticos:
# - Conexiones nuevas y desconexiones
# - Mensajes enviados y recibidos
# - Errores de conexión
# - Estadísticas de uso
```

### **Métricas Disponibles**
- Número de conexiones activas por tipo de usuario
- Mensajes enviados por canal
- Tiempo de respuesta promedio
- Errores de conexión y reconexiones

## 🚀 Deployment

### **Configuración de Producción**
```ruby
# config/production.rb
configure :production do
  set :bind, '0.0.0.0'
  set :port, ENV['PORT'] || 3001
  set :environment, :production
  
  # SSL para WebSocket seguro (WSS)
  set :ssl_certificate, 'path/to/cert.pem'
  set :ssl_private_key, 'path/to/private.key'
end
```

### **Variables de Entorno**
```bash
# Archivo .env para producción
WEBSOCKET_PORT=3001
WEBSOCKET_HOST=0.0.0.0
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/private.key
LOG_LEVEL=INFO
MAX_CONNECTIONS=1000
```

### **Docker (Opcional)**
```dockerfile
FROM ruby:3.1-slim

WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

EXPOSE 3001
CMD ["ruby", "server.rb"]
```

### **Comandos de Producción**
```bash
# Instalar dependencias
bundle install --without development test

# Ejecutar servidor en background
nohup ruby server.rb --port 3001 > websocket.log 2>&1 &

# Con Process Manager (PM2 para Node.js equivalente)
# O usar systemd para gestión de servicios
```

## 🔐 Seguridad

### **Autenticación WebSocket**
```ruby
# Validar token en conexión
def authenticate_connection(socket, token)
  # Verificar JWT token
  decoded = JWT.decode(token, secret_key, algorithm: 'HS256')
  user_id = decoded[0]['sub']
  
  # Registrar conexión autenticada
  register_authenticated_connection(socket, user_id)
rescue JWT::DecodeError
  socket.close(code: 1008, reason: 'Invalid token')
end
```

### **Rate Limiting**
- Límite de mensajes por conexión por minuto
- Throttling para prevenir spam
- Blacklist automática por abuso

### **Validación de Mensajes**
- Validación de formato JSON
- Verificación de canales permitidos
- Sanitización de datos de entrada

## 🤝 Integración con Otros Servicios

### **API REST (Python)**
El WebSocket server recibe notificaciones del API REST cuando:
- Se crea/actualiza/elimina una reserva
- Cambia el estado de una mesa
- Un cliente entra/sale de la fila virtual

### **Frontend (React)**
El frontend se conecta al WebSocket para:
- Mostrar actualizaciones en tiempo real
- Notificar cambios al usuario
- Actualizar interfaces sin refresh

### **Flujo de Integración**
```
API REST → Webhook → WebSocket Server → Frontend
    ↓                    ↓                 ↓
[Cambio BD] → [Notificación] → [Update UI]
```

## 🤝 Contribuir

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con 💎 Ruby por el equipo de Chuwue Grill**