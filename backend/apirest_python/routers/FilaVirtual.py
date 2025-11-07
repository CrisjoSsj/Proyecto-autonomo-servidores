from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional
from typing import Optional, List
from datetime import datetime, timedelta
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_fila_virtual

router = APIRouter(tags=["FilaVirtual"])

# Modelos de datos
class PersonaFilaVirtualCreate(BaseModel):
    cliente_id: int
    nombre: str
    telefono: str
    numeroPersonas: int
    hora_llegada: str
    estado: str = "esperando"

class PersonaFilaVirtual(BaseModel):
    id: int
    cliente_id: int
    nombre: str
    telefono: str
    numeroPersonas: int
    posicion: int
    tiempoEstimado: int
    hora_llegada: str
    estado: str

# Modelo legacy para compatibilidad
class FilaVirtual(BaseModel):
    id_fila: Optional[int] = None
    id_cliente: Optional[int] = None
    posicion: Optional[int] = None
    tiempo_espera: Optional[str] = None
    estado: Optional[str] = 'esperando'

# Base de datos simulada para la fila virtual
fila_virtual_db: List[PersonaFilaVirtual] = []
id_counter = 1

# Datos legacy para compatibilidad
filas_list = [
    FilaVirtual(id_fila=1, id_cliente=1, posicion=1, tiempo_espera="15 min", estado="esperando"),
    FilaVirtual(id_fila=2, id_cliente=2, posicion=2, tiempo_espera="30 min", estado="esperando"),
    FilaVirtual(id_fila=3, id_cliente=3, posicion=3, tiempo_espera="45 min", estado="esperando")
]

def calcular_tiempo_estimado(posicion: int) -> int:
    """Calcular tiempo estimado en minutos basado en la posición"""
    return posicion * 15  # 15 minutos por persona aproximadamente

def actualizar_posiciones():
    """Actualizar las posiciones y tiempos estimados de todas las personas en la fila"""
    global fila_virtual_db
    fila_virtual_db = [
        PersonaFilaVirtual(
            id=persona.id,
            cliente_id=persona.cliente_id,
            nombre=persona.nombre,
            telefono=persona.telefono,
            numeroPersonas=persona.numeroPersonas,
            posicion=index + 1,
            tiempoEstimado=calcular_tiempo_estimado(index + 1),
            hora_llegada=persona.hora_llegada,
            estado=persona.estado
        )
        for index, persona in enumerate(fila_virtual_db)
        if persona.estado == "esperando"
    ]

def Buscar_fila(id_fila: int):
    """Función legacy para buscar fila"""
    return next((fila for fila in filas_list if fila.id_fila == id_fila), None)

# ===== ENDPOINTS LEGACY =====
@router.get("/fila/")
async def fila_legacy():
    return {"api fila virtual activa"}

@router.get("/filas/")
async def filas_legacy():
    return filas_list

@router.get("/fila/{id_fila}")
async def fila_por_id_legacy(id_fila: int):
    return Buscar_fila(id_fila)

@router.post("/fila/", response_model=FilaVirtual)
async def fila(fila: FilaVirtual):
    # Generar id_fila automáticamente si no fue provisto
    max_id = 0
    for existing in filas_list:
        if existing.id_fila and existing.id_fila > max_id:
            max_id = existing.id_fila

    if fila.id_fila is None:
        fila.id_fila = max_id + 1

    # Comprobar existencia por id_fila ahora que tenemos id asignado
    exists = any(guardar_fila.id_fila == fila.id_fila for guardar_fila in filas_list)
    if exists:
        raise HTTPException(status_code=400, detail="La fila ya existe")

    # Asignar posición si no fue provista
    if fila.posicion is None:
        fila.posicion = len(filas_list) + 1

    # Asegurar tiempo_espera por defecto
    if fila.tiempo_espera is None:
        fila.tiempo_espera = "15 min"

    filas_list.append(fila)
    # Enviar notificación al WebSocket
    await broadcast_fila_virtual("join", {
        "cliente_id": fila.id_cliente,
        "posicion": fila.posicion,
        "tiempo_espera": fila.tiempo_espera,
        "estado": fila.estado
    })
    return fila

# ===== ENDPOINTS NUEVOS =====
@router.get("/fila-virtual/", response_model=List[PersonaFilaVirtual])
async def obtener_fila_virtual():
    """Obtener toda la fila virtual actual"""
    actualizar_posiciones()
    return fila_virtual_db

@router.get("/fila-virtual/{fila_id}", response_model=PersonaFilaVirtual)
async def obtener_persona_fila(fila_id: int):
    """Obtener una persona específica de la fila virtual"""
    persona = next((p for p in fila_virtual_db if p.id == fila_id), None)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada en la fila virtual")
    return persona

@router.post("/fila-virtual/", response_model=PersonaFilaVirtual)
async def agregar_a_fila_virtual(persona_data: PersonaFilaVirtualCreate):
    """Agregar una persona a la fila virtual"""
    global id_counter
    
    # Verificar si la persona ya está en la fila
    persona_existente = next(
        (p for p in fila_virtual_db if p.telefono == persona_data.telefono and p.estado == "esperando"), 
        None
    )
    if persona_existente:
        raise HTTPException(status_code=400, detail="Ya tienes una posición activa en la fila virtual")
    
    nueva_persona = PersonaFilaVirtual(
        id=id_counter,
        cliente_id=persona_data.cliente_id,
        nombre=persona_data.nombre,
        telefono=persona_data.telefono,
        numeroPersonas=persona_data.numeroPersonas,
        posicion=len(fila_virtual_db) + 1,
        tiempoEstimado=calcular_tiempo_estimado(len(fila_virtual_db) + 1),
        hora_llegada=persona_data.hora_llegada,
        estado=persona_data.estado
    )
    
    fila_virtual_db.append(nueva_persona)
    id_counter += 1
    
    # Notificar via WebSocket (opcional, depende si broadcast está disponible)
    try:
        await broadcast_fila_virtual("nueva_persona", {
            "type": "nueva_persona",
            "data": nueva_persona.dict(),
            "mensaje": f"{nueva_persona.nombre} se unió a la fila virtual"
        })
    except:
        pass  # Continuar sin WebSocket si no está disponible
    
    actualizar_posiciones()
    return nueva_persona

@router.put("/fila-virtual/{fila_id}/siguiente")
async def siguiente_en_fila(fila_id: int):
    """Llamar al siguiente en la fila (marcar como 'llamado')"""
    persona = next((p for p in fila_virtual_db if p.id == fila_id), None)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada en la fila virtual")
    
    if persona.estado != "esperando":
        raise HTTPException(status_code=400, detail="Esta persona ya no está esperando")
    
    persona.estado = "llamado"
    
    # Notificar via WebSocket (opcional)
    try:
        await broadcast_fila_virtual("persona_llamada", {
            "type": "persona_llamada",
            "data": persona.dict(),
            "mensaje": f"Es el turno de {persona.nombre} - Mesa lista"
        })
    except:
        pass
    
    return {"mensaje": f"Se ha llamado a {persona.nombre}", "persona": persona}

@router.put("/fila-virtual/{fila_id}/confirmar")
async def confirmar_llegada(fila_id: int):
    """Confirmar que la persona llegó al restaurante"""
    global fila_virtual_db
    
    persona = next((p for p in fila_virtual_db if p.id == fila_id), None)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada en la fila virtual")
    
    if persona.estado != "llamado":
        raise HTTPException(status_code=400, detail="Esta persona no ha sido llamada aún")
    
    # Remover de la fila virtual
    fila_virtual_db = [p for p in fila_virtual_db if p.id != fila_id]
    
    # Notificar via WebSocket (opcional)
    try:
        await broadcast_fila_virtual("persona_confirmada", {
            "type": "persona_confirmada",
            "data": persona.dict(),
            "mensaje": f"{persona.nombre} confirmó su llegada y fue asignado a una mesa"
        })
    except:
        pass
    
    actualizar_posiciones()
    return {"mensaje": f"{persona.nombre} confirmó su llegada", "persona": persona}

@router.delete("/fila-virtual/{fila_id}")
async def remover_de_fila(fila_id: int):
    """Remover una persona de la fila virtual (cancelar o no confirmar)"""
    global fila_virtual_db
    
    persona = next((p for p in fila_virtual_db if p.id == fila_id), None)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada en la fila virtual")
    
    # Remover de la fila
    fila_virtual_db = [p for p in fila_virtual_db if p.id != fila_id]
    
    # Notificar via WebSocket (opcional)
    try:
        await broadcast_fila_virtual("persona_removida", {
            "type": "persona_removida",
            "data": persona.dict(),
            "mensaje": f"{persona.nombre} fue removido de la fila virtual"
        })
    except:
        pass
    
    actualizar_posiciones()
    return {"mensaje": f"{persona.nombre} fue removido de la fila virtual"}

@router.get("/fila-virtual/estadisticas/resumen")
async def obtener_estadisticas_fila():
    """Obtener estadísticas de la fila virtual"""
    personas_esperando = [p for p in fila_virtual_db if p.estado == "esperando"]
    personas_llamadas = [p for p in fila_virtual_db if p.estado == "llamado"]
    
    if personas_esperando:
        tiempo_espera_max = max(p.tiempoEstimado for p in personas_esperando)
        promedio_personas = sum(p.numeroPersonas for p in personas_esperando) / len(personas_esperando)
    else:
        tiempo_espera_max = 0
        promedio_personas = 0
    
    return {
        "total_esperando": len(personas_esperando),
        "total_llamados": len(personas_llamadas),
        "tiempo_espera_maximo": tiempo_espera_max,
        "promedio_personas_por_grupo": round(promedio_personas, 1),
        "ultimo_actualizado": datetime.now().isoformat()
    }

@router.get("/fila-virtual/tiempos-estimados/por-capacidad")
async def obtener_tiempos_por_capacidad():
    """Obtener tiempos estimados organizados por capacidad de mesa"""
    personas_esperando = [p for p in fila_virtual_db if p.estado == "esperando"]
    
    tiempos_por_capacidad = {
        "2_personas": [],
        "4_personas": [],
        "6_plus_personas": []
    }
    
    for persona in personas_esperando:
        if persona.numeroPersonas <= 2:
            tiempos_por_capacidad["2_personas"].append(persona.tiempoEstimado)
        elif persona.numeroPersonas <= 4:
            tiempos_por_capacidad["4_personas"].append(persona.tiempoEstimado)
        else:
            tiempos_por_capacidad["6_plus_personas"].append(persona.tiempoEstimado)
    
    return {
        "mesa_2_personas": {
            "personas_esperando": len(tiempos_por_capacidad["2_personas"]),
            "tiempo_estimado_min": min(tiempos_por_capacidad["2_personas"]) if tiempos_por_capacidad["2_personas"] else 15,
            "tiempo_estimado_max": max(tiempos_por_capacidad["2_personas"]) if tiempos_por_capacidad["2_personas"] else 25
        },
        "mesa_4_personas": {
            "personas_esperando": len(tiempos_por_capacidad["4_personas"]),
            "tiempo_estimado_min": min(tiempos_por_capacidad["4_personas"]) if tiempos_por_capacidad["4_personas"] else 25,
            "tiempo_estimado_max": max(tiempos_por_capacidad["4_personas"]) if tiempos_por_capacidad["4_personas"] else 40
        },
        "mesa_6_plus_personas": {
            "personas_esperando": len(tiempos_por_capacidad["6_plus_personas"]),
            "tiempo_estimado_min": min(tiempos_por_capacidad["6_plus_personas"]) if tiempos_por_capacidad["6_plus_personas"] else 45,
            "tiempo_estimado_max": max(tiempos_por_capacidad["6_plus_personas"]) if tiempos_por_capacidad["6_plus_personas"] else 60
        }
    }

# Funciones auxiliares para el administrador
@router.post("/fila-virtual/admin/llamar-siguiente")
async def admin_llamar_siguiente():
    """Función para que el admin llame al siguiente en la fila"""
    siguiente = next((p for p in fila_virtual_db if p.estado == "esperando"), None)
    if not siguiente:
        raise HTTPException(status_code=404, detail="No hay personas esperando en la fila")
    
    return await siguiente_en_fila(siguiente.id)

@router.post("/fila-virtual/admin/limpiar-vencidos")
async def admin_limpiar_vencidos():
    """Limpiar personas que fueron llamadas hace más de 15 minutos y no confirmaron"""
    global fila_virtual_db
    ahora = datetime.now()
    removidos = []
    
    for persona in fila_virtual_db[:]:  # Crear copia para iteración segura
        if persona.estado == "llamado":
            try:
                hora_llamada = datetime.fromisoformat(persona.hora_llegada.replace('Z', '+00:00'))
                if ahora - hora_llamada > timedelta(minutes=15):
                    fila_virtual_db.remove(persona)
                    removidos.append(persona.nombre)
            except:
                # Si hay error al parsear fecha, remover también
                fila_virtual_db.remove(persona)
                removidos.append(persona.nombre)
    
    if removidos:
        try:
            await broadcast_fila_virtual("limpieza_vencidos", {
                "type": "limpieza_vencidos",
                "data": removidos,
                "mensaje": f"Se removieron {len(removidos)} personas que no confirmaron su llegada"
            })
        except:
            pass
        actualizar_posiciones()
    
    return {"mensaje": f"Se removieron {len(removidos)} personas vencidas", "removidos": removidos}

# ===== ENDPOINTS LEGACY ADICIONALES =====
@router.put("/fila/", response_model=FilaVirtual)
async def actualizar_fila_legacy(fila: FilaVirtual):
    """Actualizar fila existente (legacy)"""
    found = False
    for index, guardar_fila in enumerate(filas_list):
        if guardar_fila.id_fila == fila.id_fila:
            filas_list[index] = fila
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Fila no encontrada")
    
    return fila

@router.delete("/fila/{id_fila}")
async def eliminar_fila_legacy(id_fila: int):
    """Eliminar fila (legacy)"""
    global filas_list
    fila = Buscar_fila(id_fila)
    if fila is None:
        raise HTTPException(status_code=404, detail="Fila no encontrada")
    
    filas_list = [f for f in filas_list if f.id_fila != id_fila]
    return {"mensaje": f"Fila {id_fila} eliminada correctamente"}