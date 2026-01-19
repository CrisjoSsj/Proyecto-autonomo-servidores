# FindyourWork - Django REST API Service

## Descripción
Este servicio proporciona la API REST principal para FindyourWork, implementada con Django REST Framework. Gestiona las operaciones principales de la aplicación, incluyendo la autenticación, gestión de usuarios, servicios y reservas.

## Características Principales

- API RESTful completa
- Autenticación y autorización de usuarios
- Gestión de servicios y reservas
- Sistema de calificaciones y comentarios
- Manejo de perfiles de usuario (proveedores y clientes)
- Integración con base de datos SQLite

## Estructura del Proyecto

```
Python/
├── api_rest/                  # Aplicación principal
│   ├── migrations/           # Migraciones de la base de datos
│   ├── serializers/         # Serializadores para los modelos
│   ├── models.py            # Modelos de la base de datos
│   ├── views.py             # Vistas y lógica de negocio
│   ├── urls.py              # Configuración de rutas
│   ├── admin.py            # Configuración del admin de Django
│   └── tests.py            # Pruebas unitarias
│
├── mi_proyecto/             # Configuración del proyecto
│   ├── settings.py         # Configuración general
│   ├── urls.py            # URLs principales
│   ├── asgi.py            # Configuración ASGI
│   └── wsgi.py            # Configuración WSGI
│
├── requirements.txt         # Dependencias del proyecto
├── manage.py               # Script de gestión de Django
└── db.sqlite3              # Base de datos SQLite
```

## Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- Entorno virtual (recomendado)

## Instalación

1. Crear y activar un entorno virtual:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar la base de datos:
```bash
python manage.py migrate
```

4. **Configurar token de servicio para auth-service** (IMPORTANTE):
```bash
python setup_service_token.py
```
Este script genera un token de autenticación que permite al auth-service comunicarse con Django. El token se actualiza automáticamente en `Backend/auth-service/.env`.

5. Crear un superusuario (opcional):
```bash
python manage.py createsuperuser
```

## Ejecución del Servidor

```bash
python manage.py runserver
```
El servidor estará disponible en `http://localhost:8000`

## Endpoints Principales

### Autenticación
- `POST /api/auth/login/` - Inicio de sesión
- `POST /api/auth/register/` - Registro de usuarios
- `POST /api/auth/logout/` - Cierre de sesión

### Usuarios
- `GET /api/users/` - Listar usuarios
- `GET /api/users/{id}/` - Detalles de usuario
- `PUT /api/users/{id}/` - Actualizar usuario
- `DELETE /api/users/{id}/` - Eliminar usuario

### Servicios
- `GET /api/servicios/` - Listar servicios
- `POST /api/servicios/` - Crear servicio
- `GET /api/servicios/{id}/` - Detalles de servicio
- `PUT /api/servicios/{id}/` - Actualizar servicio
- `DELETE /api/servicios/{id}/` - Eliminar servicio

### Reservas
- `GET /api/reservas/` - Listar reservas
- `POST /api/reservas/` - Crear reserva
- `GET /api/reservas/{id}/` - Detalles de reserva
- `PUT /api/reservas/{id}/` - Actualizar reserva
- `DELETE /api/reservas/{id}/` - Eliminar reserva

## Pruebas

Para ejecutar las pruebas unitarias:
```bash
python manage.py test
```

## Configuración Adicional

### Variables de Entorno
El proyecto utiliza variables de entorno para la configuración. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
DEBUG=True
SECRET_KEY=tu_clave_secreta
DATABASE_URL=sqlite:///db.sqlite3
```

### Configuración de CORS
Los CORS están configurados en `settings.py`. Asegúrate de agregar los orígenes permitidos:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend Vite
    "http://localhost:3000",  # Otros clientes
]
```

## Documentación API

La documentación detallada de la API está disponible en:
- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`

## Integración con Otros Servicios

Este servicio REST se integra con:
- Servidor GraphQL (Golang) para consultas optimizadas
- Servidor WebSocket (NestJS) para actualizaciones en tiempo real
- Frontend React para la interfaz de usuario

## Contribución

1. Fork el repositorio
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Solución de Problemas Comunes

1. Error de migraciones:
```bash
python manage.py migrate --run-syncdb
```

2. Limpiar la base de datos:
```bash
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
rm db.sqlite3
python manage.py makemigrations
python manage.py migrate
```

3. Problemas de CORS:
Verifica la configuración en `settings.py` y asegúrate de que los orígenes están correctamente configurados.

## Mantenimiento

- Regularmente actualiza las dependencias
- Realiza backups de la base de datos
- Monitorea los logs para detectar errores
- Mantén las migraciones organizadas