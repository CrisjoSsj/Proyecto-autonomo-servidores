from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from .auth import current_user, UserAuth

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    responses={404: {"description": "No encontrado"}}
)

# --- MODELOS PYDANTIC ---
class EstadoRestaurante(BaseModel):
    abierto: bool
    horario_actual: str
    tiempo_espera_promedio: int
    ultima_actualizacion: datetime

class PlatoPopular(BaseModel):
    id: int
    nombre: str
    descripcion: str
    precio: float
    veces_pedido: int
    categoria: str

class Promocion(BaseModel):
    id: int
    titulo: str
    descripcion: str
    descuento: float
    fecha_inicio: date
    fecha_fin: date
    activa: bool

class ResumenDashboard(BaseModel):
    mesas_ocupadas: int
    mesas_disponibles: int
    reservas_hoy: int
    personas_en_cola: int
    ingresos_hoy: float

# --- ENDPOINTS ---

@router.get("/estado-restaurante", response_model=EstadoRestaurante, summary="Estado actual del restaurante")
async def obtener_estado_restaurante():
    """
    Obtiene el estado actual del restaurante para mostrar en el home.
    """
    try:
        # Aquí iría la lógica real para obtener el estado
        estado = {
            "abierto": True,
            "horario_actual": "11:00 AM - 10:00 PM",
            "tiempo_espera_promedio": 15,
            "ultima_actualizacion": datetime.now()
        }
        return EstadoRestaurante(**estado)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estado del restaurante: {str(e)}")

@router.get("/platos-populares", response_model=List[PlatoPopular], summary="Platos más populares")
async def obtener_platos_populares(limit: int = Query(default=6, le=20)):
    """
    Obtiene los platos más populares para mostrar en el home.
    """
    try:
        # Simulación de platos populares (reemplazar con lógica real)
        platos_populares = [
            {
                "id": 1,
                "nombre": "Alitas BBQ Clásicas",
                "descripcion": "Nuestras famosas alitas con salsa BBQ casera",
                "precio": 8.99,
                "veces_pedido": 156,
                "categoria": "Alitas"
            },
            {
                "id": 2,
                "nombre": "Chuwue Clásica",
                "descripcion": "Hamburguesa premium con ingredientes frescos",
                "precio": 10.50,
                "veces_pedido": 134,
                "categoria": "Hamburguesas"
            },
            {
                "id": 3,
                "nombre": "Parrillada para Dos",
                "descripcion": "Variedad de carnes para compartir",
                "precio": 28.99,
                "veces_pedido": 89,
                "categoria": "Parrilladas"
            }
        ]
        return [PlatoPopular(**plato) for plato in platos_populares[:limit]]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener platos populares: {str(e)}")

@router.get("/promociones-activas", response_model=List[Promocion], summary="Promociones activas")
async def obtener_promociones_activas():
    """
    Obtiene las promociones activas para mostrar en el home.
    """
    try:
        # Simulación de promociones (reemplazar con lógica real)
        promociones = [
            {
                "id": 1,
                "titulo": "2x1 en Alitas BBQ",
                "descripcion": "Lleva el doble de alitas por el mismo precio todos los martes",
                "descuento": 50.0,
                "fecha_inicio": date.today(),
                "fecha_fin": date(2024, 12, 31),
                "activa": True
            },
            {
                "id": 2,
                "titulo": "Happy Hour Bebidas",
                "descripcion": "50% de descuento en bebidas de 5:00 PM a 7:00 PM",
                "descuento": 50.0,
                "fecha_inicio": date.today(),
                "fecha_fin": date(2024, 12, 31),
                "activa": True
            }
        ]
        return [Promocion(**promo) for promo in promociones]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener promociones: {str(e)}")

@router.get("/resumen", response_model=ResumenDashboard, summary="Resumen del dashboard")
async def obtener_resumen_dashboard(user: UserAuth = Depends(current_user)):
    """
    Obtiene el resumen general para el dashboard administrativo.
    Requiere autenticación.
    """
    try:
        # Aquí iría la lógica real para calcular estadísticas
        resumen = {
            "mesas_ocupadas": 8,
            "mesas_disponibles": 4,
            "reservas_hoy": 15,
            "personas_en_cola": 3,
            "ingresos_hoy": 1847.50
        }
        return ResumenDashboard(**resumen)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen del dashboard: {str(e)}")

@router.get("/mesas-tiempo-real", summary="Estado de mesas en tiempo real")
async def obtener_mesas_tiempo_real():
    """
    Obtiene el estado actual de todas las mesas para la fila virtual.
    """
    try:
        # Simulación del estado de mesas (reemplazar con lógica real)
        mesas_estado = {
            "mesas_2_personas": [
                {"numero": 1, "estado": "disponible", "tiempo_estimado": 0},
                {"numero": 2, "estado": "ocupada", "tiempo_estimado": 30},
                {"numero": 3, "estado": "disponible", "tiempo_estimado": 0}
            ],
            "mesas_4_personas": [
                {"numero": 4, "estado": "ocupada", "tiempo_estimado": 45},
                {"numero": 5, "estado": "reservada", "tiempo_estimado": 120},
                {"numero": 6, "estado": "ocupada", "tiempo_estimado": 25},
                {"numero": 7, "estado": "limpieza", "tiempo_estimado": 5}
            ],
            "mesas_6_personas": [
                {"numero": 8, "estado": "ocupada", "tiempo_estimado": 60},
                {"numero": 9, "estado": "reservada", "tiempo_estimado": 180}
            ]
        }
        return mesas_estado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estado de mesas: {str(e)}")