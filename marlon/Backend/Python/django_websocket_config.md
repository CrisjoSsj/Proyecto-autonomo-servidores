# Configuración Django para WebSocket

## settings.py

```python
# Agregar a INSTALLED_APPS
INSTALLED_APPS = [
    # ... otras apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',  # Para CORS
    'api_rest',
]

# Configuración CORS para WebSocket
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:4000",  # WebSocket server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000",
]

CORS_ALLOW_CREDENTIALS = True

# Configuración de autenticación
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Configuración de tokens
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}
```

## urls.py (proyecto principal)

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api_rest.urls')),
]

# Servir archivos estáticos en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

## Instalación de dependencias Django

```bash
pip install django
pip install djangorestframework
pip install django-cors-headers
pip install django-rest-framework-authtoken
```

## Comandos para iniciar Django

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver 8000
```

## Ejemplo de uso con WebSocket

```python
# En tu vista de Django, puedes emitir eventos al WebSocket
import requests
import json

def notify_websocket(event_type, data):
    """Notificar al servidor WebSocket sobre cambios"""
    try:
        # Aquí podrías implementar una llamada HTTP al WebSocket server
        # o usar una cola de mensajes como Redis
        pass
    except Exception as e:
        print(f"Error notificando WebSocket: {e}")

# Ejemplo en una vista de reserva
class ReservaViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        
        # Notificar al WebSocket
        notify_websocket('reservation_created', response.data)
        
        return response
```
