# Integración WebSocket con Django REST API

## Descripción General

Este documento explica cómo integrar tu API REST de Django con el servidor WebSocket implementado en NestJS (TypeScript). La arquitectura es:

```
REST API (Django) → WebSocket Server (NestJS) → Frontend (React)
```

## Endpoints Disponibles en el WebSocket Server

El servidor WebSocket está disponible en `http://localhost:4000/api` con los siguientes endpoints:

### 1. Emitir Evento de Negocio

**POST** `/api/dashboard/emit-event`

Envía un evento de negocio al WebSocket para que sea notificado a todos los clientes conectados.

```bash
curl -X POST http://localhost:4000/api/dashboard/emit-event \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reserva:creada",
    "data": {
      "reserva": {
        "id": 1,
        "clienteId": 123,
        "estado": "confirmada",
        "fecha": "2024-11-15",
        "hora": "14:30",
        "totalEstimado": 50000
      }
    },
    "timestamp": "2024-11-15T14:30:00Z"
  }'
```

### 2. Actualizar Dashboard

**POST** `/api/dashboard/update-dashboard`

Envía datos para actualizar el dashboard en tiempo real.

```bash
curl -X POST http://localhost:4000/api/dashboard/update-dashboard \
  -H "Content-Type: application/json" \
  -d '{
    "services": {"total": 50, "activos": 45},
    "clients": {"total": 200, "activos": 150}
  }'
```

### 3. Notificar a un Rol Específico

**POST** `/api/dashboard/notify-role`

Envía una notificación a todos los usuarios con un rol específico.

```bash
curl -X POST http://localhost:4000/api/dashboard/notify-role \
  -H "Content-Type: application/json" \
  -d '{
    "role": "proveedor",
    "event": "nueva_solicitud",
    "payload": {"servicioId": 1, "clienteId": 123}
  }'
```

### 4. Notificar a un Usuario Específico

**POST** `/api/dashboard/notify-user`

Envía una notificación a un usuario específico.

```bash
curl -X POST http://localhost:4000/api/dashboard/notify-user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "event": "reserva_confirmada",
    "payload": {"reservaId": 1}
  }'
```

## Tipos de Eventos Soportados

Los siguientes tipos de eventos se pueden emitir:

- `reserva:creada` - Cuando se crea una nueva reserva
- `reserva:actualizada` - Cuando se actualiza una reserva
- `reserva:cancelada` - Cuando se cancela una reserva
- `servicio:creado` - Cuando se crea un nuevo servicio
- `servicio:actualizado` - Cuando se actualiza un servicio
- `calificacion:creada` - Cuando se crea una nueva calificación
- `cliente:nuevo` - Cuando se registra un nuevo cliente
- `proveedor:nuevo` - Cuando se registra un nuevo proveedor
- `pago:procesado` - Cuando se procesa un pago

## Integración con Django

### 1. Crear un Servicio para Notificaciones

Crea un archivo `api_rest/services/websocket_notifier.py`:

```python
import requests
from django.conf import settings
from typing import Dict, Any

class WebSocketNotifier:
    """Servicio para enviar notificaciones al servidor WebSocket"""
    
    def __init__(self):
        self.ws_server_url = getattr(settings, 'WS_SERVER_URL', 'http://localhost:4000/api')
    
    def emit_event(self, event_type: str, data: Dict[str, Any]):
        """Emite un evento al servidor WebSocket"""
        try:
            payload = {
                "type": event_type,
                "data": data,
                "timestamp": self.get_timestamp()
            }
            response = requests.post(
                f'{self.ws_server_url}/dashboard/emit-event',
                json=payload,
                timeout=5
            )
            return response.status_code == 202
        except Exception as e:
            print(f"Error emitiendo evento WebSocket: {e}")
            return False
    
    def notify_role(self, role: str, event: str, payload: Dict[str, Any]):
        """Notifica a todos los usuarios con un rol específico"""
        try:
            data = {
                "role": role,
                "event": event,
                "payload": payload
            }
            response = requests.post(
                f'{self.ws_server_url}/dashboard/notify-role',
                json=data,
                timeout=5
            )
            return response.status_code == 202
        except Exception as e:
            print(f"Error notificando role: {e}")
            return False
    
    def notify_user(self, user_id: str, event: str, payload: Dict[str, Any]):
        """Notifica a un usuario específico"""
        try:
            data = {
                "userId": user_id,
                "event": event,
                "payload": payload
            }
            response = requests.post(
                f'{self.ws_server_url}/dashboard/notify-user',
                json=data,
                timeout=5
            )
            return response.status_code == 202
        except Exception as e:
            print(f"Error notificando usuario: {e}")
            return False
    
    @staticmethod
    def get_timestamp():
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'
```

### 2. Configurar en Django Settings

En `mi_proyecto/settings.py`, añade:

```python
# WebSocket Configuration
WS_SERVER_URL = 'http://localhost:4000/api'
```

### 3. Usar en Views

En tus views de Django, importa y usa el notificador:

```python
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api_rest.services.websocket_notifier import WebSocketNotifier

notifier = WebSocketNotifier()

@api_view(['POST'])
def crear_reserva(request):
    # ... tu lógica de creación de reserva ...
    
    reserva = Reserva.objects.create(
        cliente=cliente,
        fecha=request.data['fecha'],
        hora=request.data['hora'],
        estado='pendiente',
        total_estimado=request.data['total_estimado']
    )
    
    # Emitir evento al WebSocket
    notifier.emit_event('reserva:creada', {
        'reserva': {
            'id': reserva.id,
            'clienteId': reserva.cliente.id,
            'estado': reserva.estado,
            'fecha': str(reserva.fecha),
            'hora': str(reserva.hora),
            'totalEstimado': float(reserva.total_estimado)
        }
    })
    
    # Notificar al proveedor
    notifier.notify_role('proveedor', 'nueva_reserva', {
        'reservaId': reserva.id,
        'clienteNombre': reserva.cliente.user.username
    })
    
    return Response({'success': True, 'reserva_id': reserva.id})
```

### 4. Ejemplo: Integración en Señales de Django

Crea señales automáticas en `api_rest/signals.py`:

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Reserva, Servicio, Calificacion, Cliente, Proveedor
from .services.websocket_notifier import WebSocketNotifier

notifier = WebSocketNotifier()

@receiver(post_save, sender=Reserva)
def reserva_created_or_updated(sender, instance, created, **kwargs):
    if created:
        event_type = 'reserva:creada'
    else:
        event_type = 'reserva:actualizada'
    
    notifier.emit_event(event_type, {
        'reserva': {
            'id': instance.id,
            'clienteId': instance.cliente.id,
            'estado': instance.estado,
            'fecha': str(instance.fecha),
            'hora': str(instance.hora),
            'totalEstimado': float(instance.total_estimado)
        }
    })

@receiver(post_save, sender=Servicio)
def servicio_created(sender, instance, created, **kwargs):
    if created:
        notifier.emit_event('servicio:creado', {
            'servicio': {
                'id': instance.id,
                'nombre': instance.nombre_servicio,
                'precio': float(instance.precio),
                'proveedorId': instance.proveedor.id,
                'categoriaId': instance.categoria.id
            }
        })

@receiver(post_save, sender=Calificacion)
def calificacion_created(sender, instance, created, **kwargs):
    if created:
        notifier.emit_event('calificacion:creada', {
            'calificacion': {
                'id': instance.id,
                'puntuacion': instance.puntuacion,
                'servicioId': instance.servicio.id
            }
        })

@receiver(post_save, sender=Cliente)
def cliente_created(sender, instance, created, **kwargs):
    if created:
        notifier.emit_event('cliente:nuevo', {
            'cliente': {
                'id': instance.id,
                'nombre': instance.user.username,
                'email': instance.user.email
            }
        })

# Registrar las señales en apps.py
```

En `api_rest/apps.py`:

```python
from django.apps import AppConfig

class ApiRestConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_rest'
    
    def ready(self):
        import api_rest.signals
```

## Eventos en Tiempo Real en el Frontend

### Escuchar Eventos

En React, puedes escuchar eventos del WebSocket:

```typescript
import { useEffect } from 'react';
import { onBusinessEvent, onReservaNueva } from '../websocket/socket';

export function MyComponent() {
  useEffect(() => {
    // Escuchar cualquier evento de negocio
    const unsubscribe1 = onBusinessEvent((event) => {
      console.log('Evento recibido:', event);
      // Actualizar UI aquí
    });

    // Escuchar específicamente reservas nuevas
    const unsubscribe2 = onReservaNueva((data) => {
      console.log('Nueva reserva:', data);
      // Mostrar notificación al usuario
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  return <div>Mi componente</div>;
}
```

## Testing

Para probar la integración:

1. **Inicia el servidor WebSocket**:
```bash
cd Backend/TypeScript
npm install
npm run start:dev
```

2. **Verifica que el servidor esté activo**:
```bash
curl http://localhost:4000/api/health
```

3. **Emite un evento de prueba**:
```bash
curl -X POST http://localhost:4000/api/dashboard/emit-event \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reserva:creada",
    "data": {"reserva": {"id": 1, "estado": "confirmada"}},
    "timestamp": "2024-11-15T14:30:00Z"
  }'
```

4. **Verifica el dashboard**:
Abre http://localhost:4000/dashboard.html en el navegador

## Notas Importantes

- El servidor WebSocket usa el namespace `/ws`, así que la conexión es `ws://localhost:4000/ws`
- Todos los endpoints del dashboard aceptan `POST` o `GET` según sea necesario
- Los timeouts están configurados a 5 segundos por defecto
- La reconexión automática está habilitada en el cliente
- Los eventos se registran en un historial de 100 últimos eventos

## Solución de Problemas

### El servidor WebSocket no se conecta

- Verifica que esté corriendo en puerto 4000
- Comprueba la consola de errores en el navegador
- Verifica que CORS está configurado correctamente

### Los eventos no se emiten

- Verifica que la URL del servidor WebSocket es correcta en Django
- Comprueba que los payload tienen la estructura correcta
- Revisa los logs del servidor WebSocket

### Los clientes no reciben notificaciones

- Verifica que están autenticados en el WebSocket
- Comprueba que están en la sala correcta
- Revisa que el rol está configurado correctamente
