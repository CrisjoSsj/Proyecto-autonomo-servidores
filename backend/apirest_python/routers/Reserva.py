from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_reservas

router = APIRouter(tags=["Reserva"])

# Estados válidos para una reserva
ESTADOS_RESERVA = ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_show']

# Horarios de operación del restaurante
HORARIO_APERTURA = "11:00"
HORARIO_CIERRE = "22:00"
DURACION_RESERVA_MINUTOS = 120  # 2 horas por defecto

class Reserva(BaseModel):
    id_reserva: Optional[int] = None
    id_cliente: Optional[int] = None
    id_mesa: Optional[int] = None
    fecha: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    estado: Optional[str] = 'pendiente'
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    numero_personas: Optional[int] = None
    ocasion_especial: Optional[str] = None
    comentarios: Optional[str] = None

reservas_list = []

# ===== FUNCIONES DE VALIDACIÓN =====

def parse_hora(hora_str: str) -> datetime:
    """Convierte string de hora (HH:MM) a datetime para comparación"""
    try:
        return datetime.strptime(hora_str, "%H:%M")
    except:
        return datetime.strptime(hora_str.split(":")[0] + ":00", "%H:%M")

def calcular_hora_fin(hora_inicio: str, duracion_minutos: int = DURACION_RESERVA_MINUTOS) -> str:
    """Calcula la hora de fin basada en hora de inicio y duración"""
    inicio = parse_hora(hora_inicio)
    fin = inicio + timedelta(minutes=duracion_minutos)
    return fin.strftime("%H:%M")

def horarios_se_solapan(inicio1: str, fin1: str, inicio2: str, fin2: str) -> bool:
    """Verifica si dos rangos de horario se solapan"""
    h_inicio1 = parse_hora(inicio1)
    h_fin1 = parse_hora(fin1)
    h_inicio2 = parse_hora(inicio2)
    h_fin2 = parse_hora(fin2)
    
    # Hay solapamiento si un rango empieza antes de que termine el otro
    return h_inicio1 < h_fin2 and h_inicio2 < h_fin1

def verificar_conflicto(id_mesa: int, fecha: str, hora_inicio: str, hora_fin: str, excluir_reserva_id: int = None) -> dict:
    """
    Verifica si existe conflicto con otras reservas.
    Retorna None si no hay conflicto, o dict con info del conflicto.
    """
    for r in reservas_list:
        # Ignorar la reserva actual (para ediciones)
        if excluir_reserva_id and r.id_reserva == excluir_reserva_id:
            continue
        
        # Solo verificar reservas activas (no canceladas, no_show, completadas)
        if r.estado in ['cancelada', 'no_show', 'completada']:
            continue
            
        # Verificar si es la misma mesa y fecha
        if r.id_mesa == id_mesa and r.fecha == fecha:
            r_hora_fin = r.hora_fin or calcular_hora_fin(r.hora_inicio)
            
            if horarios_se_solapan(r.hora_inicio, r_hora_fin, hora_inicio, hora_fin):
                return {
                    "reserva_existente": r.id_reserva,
                    "hora_inicio": r.hora_inicio,
                    "hora_fin": r_hora_fin,
                    "nombre": r.nombre
                }
    
    return None

def obtener_horarios_disponibles(id_mesa: int, fecha: str) -> List[str]:
    """Obtiene lista de horarios disponibles para una mesa en una fecha"""
    horarios = []
    hora_actual = parse_hora(HORARIO_APERTURA)
    hora_cierre = parse_hora(HORARIO_CIERRE)
    
    while hora_actual < hora_cierre:
        hora_str = hora_actual.strftime("%H:%M")
        hora_fin_str = calcular_hora_fin(hora_str)
        
        # Verificar si este horario está disponible
        conflicto = verificar_conflicto(id_mesa, fecha, hora_str, hora_fin_str)
        if not conflicto:
            horarios.append(hora_str)
        
        # Avanzar 30 minutos
        hora_actual += timedelta(minutes=30)
    
    return horarios

@router.get("/reserva/")
async def reserva_status():
    return {"api reserva activa"}

@router.get("/reservas/")
async def get_reservas():
    return reservas_list

#path
@router.get("/reserva/{id_reserva}")
async def get_reserva_by_id(id_reserva: int):
    return Buscar_reserva(id_reserva)

#QUERY - usando diferente endpoint para evitar conflictos
@router.get("/reserva/buscar")
async def buscar_reserva_query(id_reserva: int):
    return Buscar_reserva(id_reserva)

# ===== ENDPOINT DE DISPONIBILIDAD =====

@router.get("/reservas/disponibilidad")
async def obtener_disponibilidad(
    fecha: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
    personas: int = Query(default=2, description="Número de personas")
):
    """
    Obtiene horarios disponibles para una fecha y número de personas.
    Retorna las mesas compatibles con sus horarios libres.
    """
    from routers.Mesa import mesas_list
    
    resultado = []
    
    for mesa in mesas_list:
        # Solo mesas con capacidad suficiente
        if mesa.capacidad >= personas:
            horarios = obtener_horarios_disponibles(mesa.id_mesa, fecha)
            if horarios:
                resultado.append({
                    "mesa_id": mesa.id_mesa,
                    "numero": mesa.numero,
                    "capacidad": mesa.capacidad,
                    "horarios_disponibles": horarios
                })
    
    return {
        "fecha": fecha,
        "personas": personas,
        "mesas_disponibles": resultado,
        "total_opciones": sum(len(m["horarios_disponibles"]) for m in resultado)
    }

@router.get("/reservas/verificar-disponibilidad")
async def verificar_disponibilidad_especifica(
    mesa_id: int = Query(..., description="ID de la mesa"),
    fecha: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
    hora_inicio: str = Query(..., description="Hora de inicio en formato HH:MM")
):
    """Verifica si una mesa específica está disponible en fecha y hora."""
    hora_fin = calcular_hora_fin(hora_inicio)
    conflicto = verificar_conflicto(mesa_id, fecha, hora_inicio, hora_fin)
    
    if conflicto:
        return {
            "disponible": False,
            "mensaje": f"Mesa ocupada de {conflicto['hora_inicio']} a {conflicto['hora_fin']}",
            "conflicto": conflicto
        }
    
    return {
        "disponible": True,
        "mensaje": "Mesa disponible",
        "hora_fin_estimada": hora_fin
    }

# ===== ENDPOINTS CRUD =====

#POST
@router.post("/reserva/", response_model=Reserva)
async def crear_reserva(reserva: Reserva):
    # Generar id_reserva automáticamente
    max_id = 0
    for existing in reservas_list:
        if existing.id_reserva and existing.id_reserva > max_id:
            max_id = existing.id_reserva
    reserva.id_reserva = max_id + 1

    # Validación de campos obligatorios
    missing_fields = []
    if not reserva.fecha:
        missing_fields.append('fecha')
    if not reserva.hora_inicio:
        missing_fields.append('hora_inicio')
    if not reserva.id_mesa:
        missing_fields.append('id_mesa')
    if not reserva.nombre:
        missing_fields.append('nombre')

    if missing_fields:
        raise HTTPException(status_code=400, detail={
            'error': 'Faltan campos obligatorios',
            'missing': missing_fields
        })

    # Calcular hora_fin si no se proporciona
    if not reserva.hora_fin:
        reserva.hora_fin = calcular_hora_fin(reserva.hora_inicio)

    # *** VALIDACIÓN DE CONFLICTOS ***
    conflicto = verificar_conflicto(reserva.id_mesa, reserva.fecha, reserva.hora_inicio, reserva.hora_fin)
    if conflicto:
        raise HTTPException(status_code=409, detail={
            'error': 'Conflicto de horario',
            'mensaje': f"La mesa ya está reservada de {conflicto['hora_inicio']} a {conflicto['hora_fin']}",
            'conflicto': conflicto,
            'sugerencia': 'Usa /reservas/disponibilidad para ver horarios libres'
        })

    # Validar estado
    if reserva.estado and reserva.estado not in ESTADOS_RESERVA:
        raise HTTPException(status_code=400, detail={
            'error': 'Estado inválido',
            'estados_validos': ESTADOS_RESERVA
        })

    # Asegurar valores por defecto
    if reserva.estado is None:
        reserva.estado = 'pendiente'

    reservas_list.append(reserva)
    
    # Enviar notificación al WebSocket
    import asyncio
    try:
        asyncio.create_task(broadcast_reservas("nueva_reserva", {
            "reserva_id": reserva.id_reserva,
            "cliente_id": reserva.id_cliente,
            "mesa_id": reserva.id_mesa,
            "fecha": reserva.fecha,
            "hora_inicio": reserva.hora_inicio,
            "hora_fin": reserva.hora_fin,
            "estado": reserva.estado,
            "nombre": reserva.nombre
        }))
    except Exception as e:
        print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
    
    return reserva

#PUT
@router.put("/reserva/")
async def actualizar_reserva(reserva: Reserva):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == reserva.id_reserva:
            # Si cambia mesa, fecha u hora, validar conflictos
            if (reserva.id_mesa != guardar_reserva.id_mesa or 
                reserva.fecha != guardar_reserva.fecha or
                reserva.hora_inicio != guardar_reserva.hora_inicio):
                
                hora_fin = reserva.hora_fin or calcular_hora_fin(reserva.hora_inicio)
                conflicto = verificar_conflicto(
                    reserva.id_mesa, 
                    reserva.fecha, 
                    reserva.hora_inicio, 
                    hora_fin,
                    excluir_reserva_id=reserva.id_reserva
                )
                if conflicto:
                    raise HTTPException(status_code=409, detail={
                        'error': 'Conflicto de horario',
                        'mensaje': f"La mesa ya está reservada de {conflicto['hora_inicio']} a {conflicto['hora_fin']}",
                        'conflicto': conflicto
                    })
            
            # Validar estado
            if reserva.estado and reserva.estado not in ESTADOS_RESERVA:
                raise HTTPException(status_code=400, detail={
                    'error': 'Estado inválido',
                    'estados_validos': ESTADOS_RESERVA
                })
            
            reservas_list[index] = reserva
            found = True
            
            import asyncio
            try:
                asyncio.create_task(broadcast_reservas("update_reservation", {
                    "reserva_id": reserva.id_reserva,
                    "estado": reserva.estado,
                    "fecha": reserva.fecha,
                    "hora_inicio": reserva.hora_inicio
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            return {"message": "Reserva actualizada exitosamente", "reserva": reserva}
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la reserva")

# Endpoint para cambiar estado fácilmente
@router.put("/reserva/{id_reserva}/estado")
async def cambiar_estado_reserva(id_reserva: int, nuevo_estado: str = Query(...)):
    """Cambia el estado de una reserva (pendiente, confirmada, en_curso, completada, cancelada, no_show)"""
    if nuevo_estado not in ESTADOS_RESERVA:
        raise HTTPException(status_code=400, detail={
            'error': 'Estado inválido',
            'estados_validos': ESTADOS_RESERVA
        })
    
    for reserva in reservas_list:
        if reserva.id_reserva == id_reserva:
            estado_anterior = reserva.estado
            reserva.estado = nuevo_estado
            
            import asyncio
            try:
                asyncio.create_task(broadcast_reservas("cambio_estado", {
                    "reserva_id": id_reserva,
                    "estado_anterior": estado_anterior,
                    "estado_nuevo": nuevo_estado,
                    "mesa_id": reserva.id_mesa
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            
            return {
                "message": f"Estado cambiado de '{estado_anterior}' a '{nuevo_estado}'",
                "reserva": reserva
            }
    
    raise HTTPException(status_code=404, detail="Reserva no encontrada")

# Endpoint para obtener reservas del día
@router.get("/reservas/hoy")
async def get_reservas_hoy():
    """Obtiene todas las reservas del día actual"""
    hoy = datetime.now().strftime("%Y-%m-%d")
    reservas_hoy = [r for r in reservas_list if r.fecha == hoy]
    
    return {
        "fecha": hoy,
        "total": len(reservas_hoy),
        "por_estado": {
            estado: len([r for r in reservas_hoy if r.estado == estado])
            for estado in ESTADOS_RESERVA
        },
        "reservas": reservas_hoy
    }

# Endpoint para obtener estadísticas
@router.get("/reservas/estadisticas")
async def get_estadisticas_reservas():
    """Obtiene estadísticas de reservas"""
    hoy = datetime.now().strftime("%Y-%m-%d")
    reservas_hoy = [r for r in reservas_list if r.fecha == hoy]
    
    return {
        "total_reservas": len(reservas_list),
        "reservas_hoy": len(reservas_hoy),
        "pendientes_hoy": len([r for r in reservas_hoy if r.estado == 'pendiente']),
        "confirmadas_hoy": len([r for r in reservas_hoy if r.estado == 'confirmada']),
        "en_curso": len([r for r in reservas_hoy if r.estado == 'en_curso']),
        "completadas_hoy": len([r for r in reservas_hoy if r.estado == 'completada']),
        "canceladas_hoy": len([r for r in reservas_hoy if r.estado == 'cancelada']),
        "no_show_hoy": len([r for r in reservas_hoy if r.estado == 'no_show']),
        "estados_validos": ESTADOS_RESERVA
    }

#Delete
@router.delete("/reserva/{id}")
async def eliminar_reserva(id: int):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == id:
            reserva_eliminada = reservas_list[index]
            del reservas_list[index]
            found = True
            # Enviar notificación al WebSocket (no-bloqueante)
            import asyncio
            try:
                asyncio.create_task(broadcast_reservas("reserva_eliminada", {
                    "reserva_id": reserva_eliminada.id_reserva,
                    "fecha": reserva_eliminada.fecha,
                    "hora_inicio": reserva_eliminada.hora_inicio
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            return {
                "message": "Reserva eliminada exitosamente", 
                "reserva_eliminada": {
                    "id_reserva": reserva_eliminada.id_reserva,
                    "fecha": reserva_eliminada.fecha,
                    "hora_inicio": reserva_eliminada.hora_inicio
                }
            }
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la reserva")

#funciones
def Buscar_reserva(id_reserva: int):
    reservas = filter(lambda reserva: reserva.id_reserva == id_reserva, reservas_list)
    try:
        result = list(reservas)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado la reserva")   
