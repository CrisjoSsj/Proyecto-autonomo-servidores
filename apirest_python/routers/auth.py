### Sistema de Autenticación JWT ###

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

# Configuración JWT
ALGORITHM = "HS256"
ACCESS_TOKEN_DURATION = 60  # 60 minutos
SECRET = "restaurante_secret_key_2024_proyecto_autonomo_servidores"

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={status.HTTP_404_NOT_FOUND: {"message": "No encontrado"}}
)

oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login")
crypt = CryptContext(schemes=["bcrypt"])

# Modelos de usuario para autenticación
class UserAuth(BaseModel):
    username: str
    full_name: str
    email: str
    telefono: str
    disabled: bool

class UserAuthDB(UserAuth):
    password: str

class UserCreate(BaseModel):
    username: str
    full_name: str
    email: str
    telefono: str
    password: str

# Base de datos de usuarios con autenticación
# Las contraseñas están hasheadas con bcrypt
users_auth_db = {
    "crisjo": {
        "username": "crisjo",
        "full_name": "Crisjo Admin",
        "email": "crisjo@restaurante.com",
        "telefono": "123456789",
        "disabled": False,
        "password": "$2a$12$B2Gq.Dps1WYf2t57eiIKjO4DXC3IUMUXISJF62bSRiFfqMdOI2Xa6"  # secret
    },
    "victoria": {
        "username": "victoria",
        "full_name": "Victoria Manager",
        "email": "victoria@restaurante.com",
        "telefono": "987654321",
        "disabled": False,
        "password": "$2a$12$SduE7dE.i3/ygwd0Kol8bOFvEABaoOOlC8JsCSr6wpwB4zl5STU4S"  # mysecretpassword
    },
    "kilian": {
        "username": "kilian",
        "full_name": "Kilian User",
        "email": "kilian@restaurante.com",
        "telefono": "555666777",
        "disabled": False,
        "password": "$2a$12$B2Gq.Dps1WYf2t57eiIKjO4DXC3IUMUXISJF62bSRiFfqMdOI2Xa6"  # secret
    }
}

# Funciones de búsqueda de usuarios
def search_user_db(username: str):
    """Busca usuario en la base de datos con contraseña"""
    if username in users_auth_db:
        return UserAuthDB(**users_auth_db[username])
    return None

def search_user(username: str):
    """Busca usuario sin contraseña"""
    if username in users_auth_db:
        return UserAuth(**users_auth_db[username])
    return None

# Función de autenticación del token
async def auth_user(token: str = Depends(oauth2)):
    """Verifica el token JWT y devuelve el usuario"""
    exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación inválidas",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        username = jwt.decode(token, SECRET, algorithms=[ALGORITHM]).get("sub")
        if username is None:
            raise exception
    except JWTError:
        raise exception

    user = search_user(username)
    if user is None:
        raise exception
    
    return user

# Función para obtener el usuario actual
async def current_user(user: UserAuth = Depends(auth_user)):
    """Verifica que el usuario esté activo"""
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return user

# Endpoint de login
@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    """Endpoint para iniciar sesión y obtener token JWT"""
    
    # Verificar si el usuario existe
    user_db = users_auth_db.get(form.username)
    if not user_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El usuario no es correcto"
        )

    user = search_user_db(form.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Error en la autenticación"
        )

    # Verificar la contraseña
    if not crypt.verify(form.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="La contraseña no es correcta"
        )

    # Crear token de acceso
    access_token = {
        "sub": user.username,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_DURATION)
    }

    return {
        "access_token": jwt.encode(access_token, SECRET, algorithm=ALGORITHM), 
        "token_type": "bearer"
    }

# Endpoint para obtener información del usuario actual
@router.get("/users/me")
async def me(user: UserAuth = Depends(current_user)):
    """Obtiene la información del usuario autenticado"""
    return user

# Endpoint para registrar nuevo usuario
@router.post("/register", response_model=UserAuth)
async def register(user_data: UserCreate):
    """Registra un nuevo usuario en el sistema"""
    
    # Verificar si el usuario ya existe
    if user_data.username in users_auth_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya existe"
        )
    
    # Hashear la contraseña
    hashed_password = crypt.hash(user_data.password)
    
    # Crear nuevo usuario
    new_user = {
        "username": user_data.username,
        "full_name": user_data.full_name,
        "email": user_data.email,
        "telefono": user_data.telefono,
        "disabled": False,
        "password": hashed_password
    }
    
    # Agregar a la base de datos
    users_auth_db[user_data.username] = new_user
    
    # Retornar usuario sin contraseña
    return UserAuth(**new_user)

# Endpoint para obtener todos los usuarios (requiere autenticación)
@router.get("/users")
async def get_all_users(current_user: UserAuth = Depends(current_user)):
    """Obtiene lista de todos los usuarios (requiere autenticación)"""
    users = []
    for username, user_data in users_auth_db.items():
        users.append(UserAuth(**user_data))
    return users

# Endpoint para verificar el estado de autenticación
@router.get("/verify")
async def verify_token(user: UserAuth = Depends(current_user)):
    """Verifica si el token es válido"""
    return {"message": "Token válido", "user": user.username}
