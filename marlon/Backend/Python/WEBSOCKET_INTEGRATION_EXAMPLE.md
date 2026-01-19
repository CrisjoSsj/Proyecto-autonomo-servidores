# Ejemplo de Integración WebSocket en Django

## Archivos a crear/modificar

### 1. `api_rest/services/websocket_notifier.py` (CREAR)

```python
import requests
import json
from django.conf import settings
from typing import Dict, Any, Optional
from datetime import datetime

class WebSocketNotifier:
    """
    Servicio para enviar notificaciones al servidor WebSocket.
    Utiliza la arquitectura: Django REST → WebSocket Server → Frontend
    """
    
    def __init__(self):
        self.ws_server_url = getattr(
            settings, 
            'WS_SERVER_URL', 
            'http://localhost:4000/api'
        )
        self.timeout = 5
    
    def emit_event(self, event_type: str, data: Dict[str, Any]) -> bool:
        """
        Emite un evento de negocio al servidor WebSocket.
        
        Args:
            event_type: Tipo de evento (ej: 'reserva:creada')
            data: Datos del evento
            
        Returns:
            True si se envió exitosamente, False en caso contrario
        """
        try:
            payload = {
                "type": event_type,
                "data": data,
                "timestamp": self.get_timestamp()
            }
            
            response = requests.post(
                f'{self.ws_server_url}/dashboard/emit-event',
                json=payload,
                timeout=self.timeout
            )
            
            success = response.status_code in [200, 202]
            if not success:
                print(f"⚠️ WebSocket emit error: {response.status_code}")
            return success
            
        except requests.exceptions.Timeout:
            print(f"❌ WebSocket timeout emitiendo {event_type}")
            return False
        except Exception as e:
            print(f"❌ Error emitiendo evento WebSocket: {e}")
            return False
    
    def notify_role(
        self, 
        role: str, 
        event: str, 
        payload: Dict[str, Any]
    ) -> bool:
        """
        Notifica a todos los usuarios con un rol específico.
        
        Args:
            role: Rol ('cliente', 'proveedor', 'admin')
            event: Nombre del evento
            payload: Datos a enviar
            
        Returns:
            True si se envió exitosamente
        """
        try:
            data = {
                "role": role,
                "event": event,
                "payload": payload
            }
            response = requests.post(
                f'{self.ws_server_url}/dashboard/notify-role',
                json=data,
                timeout=self.timeout
            )
            return response.status_code in [200, 202]
        except Exception as e:
            print(f"❌ Error notificando role {role}: {e}")
            return False
    
    def notify_user(
        self, 
        user_id: str, 
        event: str, 
        payload: Dict[str, Any]
    ) -> bool:
        """
        Notifica a un usuario específico.
        
        Args:
            user_id: ID del usuario
            event: Nombre del evento
            payload: Datos a enviar
            
        Returns:
            True si se envió exitosamente
        """
        try:
            data = {
                "userId": str(user_id),
                "event": event,
                "payload": payload
            }
            response = requests.post(
                f'{self.ws_server_url}/dashboard/notify-user',
                json=data,
                timeout=self.timeout
            )
            return response.status_code in [200, 202]
        except Exception as e:
            print(f"❌ Error notificando usuario {user_id}: {e}")
            return False
    
    def update_dashboard(self, data: Dict[str, Any]) -> bool:
        """
        Actualiza datos en el dashboard.
        """
        try:
            response = requests.post(
                f'{self.ws_server_url}/dashboard/update-dashboard',
                json=data,
                timeout=self.timeout
            )
            return response.status_code in [200, 202]
        except Exception as e:
            print(f"❌ Error actualizando dashboard: {e}")
            return False
    
    @staticmethod
    def get_timestamp() -> str:
        """Retorna el timestamp en formato ISO"""
        return datetime.utcnow().isoformat() + 'Z'


# Instancia global para usar en toda la aplicación
websocket_notifier = WebSocketNotifier()
```

### 2. `api_rest/signals.py` (MODIFICAR O CREAR)

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import (
    Reserva, Servicio, Calificacion, 
    Cliente, Proveedor, Pago
)
from .services.websocket_notifier import websocket_notifier

# ============================================================
# SEÑALES PARA RESERVAS
# ============================================================

@receiver(post_save, sender=Reserva)
def on_reserva_changed(sender, instance, created, **kwargs):
    """Se dispara cuando se crea o actualiza una reserva"""
    
    if created:
        event_type = 'reserva:creada'
        print(f"✅ Nueva reserva #{instance.id} creada")
    else:
        event_type = 'reserva:actualizada'
        print(f"🔄 Reserva #{instance.id} actualizada")
    
    # Preparar datos del evento
    event_data = {
        'reserva': {
            'id': instance.id,
            'clienteId': instance.cliente.id,
            'estado': instance.estado,
            'fecha': str(instance.fecha),
            'hora': str(instance.hora),
            'totalEstimado': float(instance.total_estimado),
            'createdAt': instance.created_at.isoformat(),
        }
    }
    
    # Emitir evento general
    websocket_notifier.emit_event(event_type, event_data)
    
    # Notificar a proveedores si es nueva
    if created:
        websocket_notifier.notify_role('proveedor', 'nueva_reserva', {
            'reservaId': instance.id,
            'clienteNombre': instance.cliente.user.username,
            'fecha': str(instance.fecha),
            'hora': str(instance.hora),
        })
    
    # Notificar al cliente
    websocket_notifier.notify_user(
        str(instance.cliente.user.id),
        'reserva_actualizada' if not created else 'reserva_confirmada',
        {
            'reservaId': instance.id,
            'estado': instance.estado,
            'totalEstimado': float(instance.total_estimado),
        }
    )


@receiver(post_delete, sender=Reserva)
def on_reserva_deleted(sender, instance, **kwargs):
    """Se dispara cuando se elimina una reserva"""
    
    event_data = {
        'reserva': {
            'id': instance.id,
            'clienteId': instance.cliente.id,
        }
    }
    
    websocket_notifier.emit_event('reserva:cancelada', event_data)
    websocket_notifier.notify_role('admin', 'reserva_eliminada', {
        'reservaId': instance.id,
    })


# ============================================================
# SEÑALES PARA SERVICIOS
# ============================================================

@receiver(post_save, sender=Servicio)
def on_servicio_changed(sender, instance, created, **kwargs):
    """Se dispara cuando se crea o actualiza un servicio"""
    
    if created:
        event_type = 'servicio:creado'
        print(f"✨ Nuevo servicio #{instance.id} creado")
    else:
        event_type = 'servicio:actualizado'
        print(f"🔄 Servicio #{instance.id} actualizado")
    
    event_data = {
        'servicio': {
            'id': instance.id,
            'nombre': instance.nombre_servicio,
            'descripcion': instance.descripcion,
            'precio': float(instance.precio),
            'proveedorId': instance.proveedor.id,
            'categoriaId': instance.categoria.id,
            'ratingPromedio': instance.rating_promedio,
            'duracion': str(instance.duracion) if instance.duracion else None,
        }
    }
    
    websocket_notifier.emit_event(event_type, event_data)
    
    # Si es nuevo, notificar a clientes
    if created:
        websocket_notifier.notify_role('cliente', 'nuevo_servicio_disponible', {
            'servicioId': instance.id,
            'nombre': instance.nombre_servicio,
            'categoriaId': instance.categoria.id,
        })


# ============================================================
# SEÑALES PARA CALIFICACIONES
# ============================================================

@receiver(post_save, sender=Calificacion)
def on_calificacion_created(sender, instance, created, **kwargs):
    """Se dispara cuando se crea una calificación"""
    
    if not created:
        return  # Solo nos interesa la creación
    
    print(f"⭐ Nueva calificación #{instance.id} creada")
    
    event_data = {
        'calificacion': {
            'id': instance.id,
            'puntuacion': instance.puntuacion,
            'servicioId': instance.servicio.id,
            'clienteId': instance.cliente.id,
            'createdAt': instance.created_at.isoformat(),
        }
    }
    
    websocket_notifier.emit_event('calificacion:creada', event_data)
    
    # Notificar al proveedor
    websocket_notifier.notify_user(
        str(instance.servicio.proveedor.user.id),
        'nueva_calificacion',
        {
            'servicioId': instance.servicio.id,
            'puntuacion': instance.puntuacion,
            'nombreCliente': instance.cliente.user.username,
        }
    )


# ============================================================
# SEÑALES PARA CLIENTES
# ============================================================

@receiver(post_save, sender=Cliente)
def on_cliente_created(sender, instance, created, **kwargs):
    """Se dispara cuando se registra un nuevo cliente"""
    
    if not created:
        return  # Solo nos interesa la creación
    
    print(f"👤 Nuevo cliente #{instance.id} registrado")
    
    event_data = {
        'cliente': {
            'id': instance.id,
            'nombre': instance.user.username,
            'email': instance.user.email,
            'telefono': instance.telefono,
            'createdAt': instance.created_at.isoformat(),
        }
    }
    
    websocket_notifier.emit_event('cliente:nuevo', event_data)
    
    # Notificar a admins
    websocket_notifier.notify_role('admin', 'nuevo_cliente_registrado', {
        'clienteId': instance.id,
        'nombre': instance.user.username,
        'email': instance.user.email,
    })


# ============================================================
# SEÑALES PARA PROVEEDORES
# ============================================================

@receiver(post_save, sender=Proveedor)
def on_proveedor_created(sender, instance, created, **kwargs):
    """Se dispara cuando se registra un nuevo proveedor"""
    
    if not created:
        return  # Solo nos interesa la creación
    
    print(f"👨‍💼 Nuevo proveedor #{instance.id} registrado")
    
    event_data = {
        'proveedor': {
            'id': instance.id,
            'nombre': instance.user.username,
            'email': instance.user.email,
            'createdAt': instance.created_at.isoformat(),
        }
    }
    
    websocket_notifier.emit_event('proveedor:nuevo', event_data)
    
    # Notificar a admins
    websocket_notifier.notify_role('admin', 'nuevo_proveedor_registrado', {
        'proveedorId': instance.id,
        'nombre': instance.user.username,
        'email': instance.user.email,
    })


# ============================================================
# SEÑALES PARA PAGOS
# ============================================================

@receiver(post_save, sender=Pago)
def on_pago_changed(sender, instance, created, **kwargs):
    """Se dispara cuando se crea o actualiza un pago"""
    
    if created:
        print(f"💳 Nuevo pago #{instance.id} procesado")
    
    event_data = {
        'pago': {
            'id': instance.id,
            'monto': float(instance.monto),
            'estado': instance.estado,
            'reservaId': instance.reserva.id if instance.reserva else None,
            'createdAt': instance.created_at.isoformat(),
        }
    }
    
    websocket_notifier.emit_event('pago:procesado', event_data)
    
    # Notificar al cliente
    if instance.reserva:
        websocket_notifier.notify_user(
            str(instance.reserva.cliente.user.id),
            'pago_procesado',
            {
                'pagoId': instance.id,
                'monto': float(instance.monto),
                'estado': instance.estado,
            }
        )
```

### 3. `api_rest/apps.py` (MODIFICAR)

```python
from django.apps import AppConfig

class ApiRestConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_rest'
    
    def ready(self):
        """Se llama cuando Django carga la app"""
        import api_rest.signals  # Registrar las señales
```

### 4. `mi_proyecto/settings.py` (AGREGAR)

```python
# WebSocket Configuration
WS_SERVER_URL = 'http://localhost:4000/api'

# En INSTALLED_APPS, asegúrate de que 'api_rest' esté presente
# En ALLOWED_HOSTS, agrega 'localhost:4000'
ALLOWED_HOSTS = ['*']  # O especificar direcciones
```

## Uso en Views

Aquí hay un ejemplo de cómo usar el notificador en un view:

```python
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from .models import Reserva
from .serializers import ReservaSerializer
from .services.websocket_notifier import websocket_notifier

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear una nueva reserva"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Las señales se disparan automáticamente aquí
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_update(self, serializer):
        """Actualizar una reserva"""
        # Las señales se disparan automáticamente aquí
        serializer.save()
```

## Testing de la Integración

```bash
# 1. Inicia el servidor WebSocket
cd Backend/TypeScript
npm run start:dev

# 2. Inicia Django
cd Backend/Python
python manage.py runserver

# 3. En otra terminal, prueba creando una reserva
curl -X POST http://localhost:8000/api/reservas/ \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "fecha": "2024-11-20",
    "hora": "14:30",
    "total_estimado": 50000
  }'

# 4. Verifica en el dashboard del WebSocket que el evento aparece
# http://localhost:4000/dashboard.html
```

## Notas Importantes

1. **Señales de Django**: Los eventos se emiten automáticamente cuando se crean/actualizan modelos
2. **Asincronía**: Las llamadas al WebSocket se hacen síncronamente, considera usar `celery` para aplicaciones más grandes
3. **Timeout**: El timeout está configurado a 5 segundos
4. **Errores**: Los errores se imprimen en la consola de Django, considera usar un logger en producción
