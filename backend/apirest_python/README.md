# 🐍 API REST - Chuwue Grill

API REST principal del sistema de restaurante desarrollada con **FastAPI** y **Python**. Proporciona todas las operaciones CRUD necesarias para la gestión completa del restaurante, incluyendo autenticación JWT y validación de datos.

## 🎯 Características Principales

### **🔐 Autenticación y Seguridad**
- **JWT (JSON Web Tokens)** para autenticación segura
- **Bcrypt** para hashing de contraseñas
- **OAuth2** con flujo de contraseña
- **Middleware de autenticación** para endpoints protegidos

### **📊 Gestión Completa de Entidades**
- **Restaurantes** - Información básica y configuración
- **Clientes** - Base de datos de clientes del restaurante
- **Mesas** - Estados y capacidad de mesas
- **Reservas** - Sistema completo de reservas
- **Menú** - Gestión de menús por fecha
- **Platos** - Catálogo de platos con precios
- **Categorías** - Organización del menú
- **Fila Virtual** - Sistema de cola de espera
- **Usuarios** - Gestión de usuarios del sistema

### **⚡ Funcionalidades Técnicas**
- **Validación Automática** con Pydantic
- **Documentación Interactiva** con Swagger UI
- **Manejo de Errores** estructurado con HTTPException
- **Tipado Estático** para mejor desarrollo
- **Estructura Modular** con routers separados

## 🏗️ Arquitectura

### **Estructura de Archivos**
```
apirest_python/
├── routers/                    # Endpoints organizados por entidad
│   ├── auth.py                # 🔐 Autenticación JWT
│   ├── user.py                # 👤 Gestión de usuarios
│   ├── Restaurante.py         # 🏢 CRUD de restaurantes
│   ├── Cliente.py             # 👥 CRUD de clientes
│   ├── Mesa.py                # 🪑 Gestión de mesas
│   ├── Reserva.py             # 📅 Sistema de reservas
│   ├── Menu.py                # 📋 Gestión de menús
│   ├── Plato.py               # 🍽️ CRUD de platos
│   ├── CategoriaMenu.py       # 📂 Categorías de menú
│   └── FilaVirtual.py         # ⏳ Cola virtual de espera
├── main.py                    # 🚀 Aplicación principal FastAPI
├── requirements.txt           # 📦 Dependencias Python
├── .venv/                     # 🐍 Entorno virtual
└── README.md                  # 📖 Esta documentación
```

### **Patrón de Diseño**
- **Router Pattern** - Endpoints organizados por dominio
- **Dependency Injection** - Para autenticación y validación
- **Model-View-Controller** - Separación clara de responsabilidades
- **Repository Pattern** - Funciones de búsqueda centralizadas

## 🔧 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **FastAPI** | `0.104.1` | Framework web principal |
| **Pydantic** | `2.5.0` | Validación y serialización de datos |
| **Python-Jose** | `3.3.0` | Manejo de tokens JWT |
| **Passlib** | `1.7.4` | Hashing seguro de contraseñas |
| **Bcrypt** | - | Algoritmo de hashing |
| **Python-Multipart** | `0.0.6` | Soporte para formularios |
| **Uvicorn** | `0.24.0` | Servidor ASGI de alto rendimiento |

## 🚀 Instalación y Configuración

### **1. Prerrequisitos**
- Python 3.8 o superior
- pip (gestor de paquetes Python)

### **2. Configuración del Entorno**
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd apirest_python

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### **3. Ejecutar la API**
```bash
# Servidor de desarrollo con auto-reload
uvicorn main:app --reload

# Servidor de producción
uvicorn main:app --host 0.0.0.0 --port 8000
```

### **4. Acceder a la Documentación**
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## 📚 Documentación de la API

### **🔐 Autenticación**

#### **Registrar Usuario**
```http
POST /auth/register
Content-Type: application/json

{
    "username": "nuevo_usuario",
    "full_name": "Usuario Nuevo",
    "email": "usuario@email.com", 
    "telefono": "123456789",
    "password": "mi_password_seguro"
}
```

#### **Iniciar Sesión**
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=crisjo&password=secret
```

**Respuesta:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
}
```

#### **Obtener Perfil**
```http
GET /auth/users/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### **🏢 Gestión de Restaurantes**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/restaurante` | Estado del servicio |
| `GET` | `/restaurantes` | Listar todos los restaurantes |
| `GET` | `/restaurante/{id}` | Obtener restaurante específico |
| `POST` | `/restaurante/` | Crear nuevo restaurante |
| `PUT` | `/restaurante/` | Actualizar restaurante |
| `DELETE` | `/restaurante/{id}` | Eliminar restaurante |

### **👥 Gestión de Clientes**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/cliente/` | Estado del servicio |
| `GET` | `/clientes/` | Listar todos los clientes |
| `GET` | `/cliente/{id}` | Obtener cliente específico |
| `POST` | `/cliente/` | Crear nuevo cliente |
| `PUT` | `/cliente/` | Actualizar cliente |
| `DELETE` | `/cliente/{id}` | Eliminar cliente |

### **🪑 Gestión de Mesas**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/mesa/` | Estado del servicio |
| `GET` | `/mesas/` | Listar todas las mesas |
| `GET` | `/mesa/{id}` | Obtener mesa específica |
| `POST` | `/mesa/` | Crear nueva mesa |
| `PUT` | `/mesa/` | Actualizar estado de mesa |
| `DELETE` | `/mesa/{id}` | Eliminar mesa |

### **📅 Sistema de Reservas**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/reserva/` | Estado del servicio |
| `GET` | `/reservas/` | Listar todas las reservas |
| `GET` | `/reserva/{id}` | Obtener reserva específica |
| `POST` | `/reserva/` | Crear nueva reserva |
| `PUT` | `/reserva/` | Actualizar reserva |
| `DELETE` | `/reserva/{id}` | Cancelar reserva |

## 🔍 Modelos de Datos

### **Usuario de Autenticación**
```python
class UserAuth(BaseModel):
    username: str
    full_name: str
    email: str
    telefono: str
    disabled: bool
```

### **Restaurante**
```python
class Restaurante(BaseModel):
    id_restaurante: int
    nombre: str
    direccion: str
    telefono: str
```

### **Cliente**
```python
class Cliente(BaseModel):
    id_cliente: int
    nombre: str
    correo: str
    telefono: str
```

### **Mesa**
```python
class Mesa(BaseModel):
    id_mesa: int
    numero: int
    capacidad: int
    estado: str  # "disponible", "ocupada", "reservada"
```

### **Reserva**
```python
class Reserva(BaseModel):
    id_reserva: int
    id_cliente: int
    id_mesa: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    estado: str  # "confirmada", "pendiente", "cancelada"
```

## 🛡️ Seguridad

### **Configuración JWT**
- **Algoritmo**: HS256
- **Duración del Token**: 60 minutos
- **Secret Key**: Configurada específicamente para el proyecto
- **Headers requeridos**: `Authorization: Bearer <token>`

### **Usuarios Predefinidos**
| Username | Password | Rol |
|----------|----------|-----|
| `crisjo` | `secret` | Admin |
| `victoria` | `mysecretpassword` | Manager |
| `kilian` | `secret` | User |

### **Códigos de Estado HTTP**
- **200 OK** - Operación exitosa
- **400 Bad Request** - Datos inválidos o recurso ya existe
- **401 Unauthorized** - Token inválido o faltante
- **404 Not Found** - Recurso no encontrado
- **422 Unprocessable Entity** - Error de validación Pydantic

## 🧪 Testing

### **Probar Endpoints con curl**
```bash
# Obtener token
curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=crisjo&password=secret"

# Usar token para acceder a endpoint protegido
curl -X GET "http://localhost:8000/auth/users/me" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Crear nuevo restaurante
curl -X POST "http://localhost:8000/restaurante/" \
     -H "Content-Type: application/json" \
     -d '{"id_restaurante":4,"nombre":"Nuevo Local","direccion":"Calle Nueva","telefono":"999888777"}'
```

### **Probar con Swagger UI**
1. Abrir `http://localhost:8000/docs`
2. Usar el botón "Authorize" para introducir el token JWT
3. Probar todos los endpoints interactivamente

## 📈 Monitoreo y Logs

### **Logs de la Aplicación**
FastAPI automáticamente registra:
- Requests HTTP con método, path y código de estado
- Errores de validación y excepciones
- Tiempo de respuesta de endpoints

### **Métricas Disponibles**
- Número de requests por endpoint
- Tiempo de respuesta promedio
- Errores por tipo (4xx, 5xx)
- Usuarios activos (con tokens válidos)

## 🚀 Deployment

### **Variables de Entorno**
```bash
# Archivo .env (crear en producción)
SECRET_KEY=tu_clave_secreta_super_segura
ACCESS_TOKEN_DURATION=60
ALGORITHM=HS256
```

### **Docker (Opcional)**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Comandos de Producción**
```bash
# Instalar dependencias de producción
pip install -r requirements.txt

# Ejecutar con múltiples workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Con SSL (recomendado)
uvicorn main:app --host 0.0.0.0 --port 443 --ssl-keyfile key.pem --ssl-certfile cert.pem
```

## 🤝 Contribuir

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** un Pull Request
