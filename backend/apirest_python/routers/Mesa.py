from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_mesas, broadcast_fila_virtual

router = APIRouter(tags=["Mesa"])

# Estados válidos para una mesa
ESTADOS_MESA = ['disponible', 'ocupada', 'reservada', 'mantenimiento']

class Mesa(BaseModel):
    id_mesa: int
    numero: int
    capacidad: int
    estado: str

mesas_list = [Mesa(id_mesa=1, numero=1, capacidad=2, estado="disponible"),
              Mesa(id_mesa=2, numero=2, capacidad=4, estado="disponible"),
              Mesa(id_mesa=3, numero=3, capacidad=6, estado="ocupada"),
              Mesa(id_mesa=4, numero=4, capacidad=8, estado="disponible"),
              Mesa(id_mesa=5, numero=5, capacidad=4, estado="reservada"),
              Mesa(id_mesa=6, numero=6, capacidad=2, estado="disponible")]

# ===== FUNCIÓN DE ASIGNACIÓN AUTOMÁTICA =====

async def asignar_siguiente_en_cola(mesa: Mesa):
    """
    Busca al siguiente en la fila virtual que necesite una mesa con esta capacidad
    y lo marca como 'llamado'.
    """
    try:
        from routers.FilaVirtual import fila_virtual_db, PersonaFilaVirtual
        import asyncio
        
        # Buscar primera persona esperando que quepa en esta mesa
        for persona in fila_virtual_db:
            if persona.estado == "esperando" and persona.numeroPersonas <= mesa.capacidad:
                persona.estado = "llamado"
                
                # Notificar via WebSocket
                try:
                    asyncio.create_task(broadcast_fila_virtual("mesa_asignada", {
                        "type": "mesa_asignada",
                        "persona_id": persona.id,
                        "persona_nombre": persona.nombre,
                        "mesa_id": mesa.id_mesa,
                        "mesa_numero": mesa.numero,
                        "capacidad": mesa.capacidad,
                        "mensaje": f"¡{persona.nombre}! Tu mesa #{mesa.numero} está lista"
                    }))
                except Exception as e:
                    print(f"⚠️ Error notificando asignación: {str(e)}")
                
                print(f"✅ Mesa #{mesa.numero} asignada automáticamente a {persona.nombre}")
                return persona
        
        return None
    except Exception as e:
        print(f"⚠️ Error en asignación automática: {str(e)}")
        return None

@router.get("/mesa/")
async def mesa_status():
    return {"api mesa activa"}

@router.get("/mesas/")
async def get_mesas():
    return mesas_list

#path
@router.get("/mesa/{id_mesa}")
async def get_mesa_by_id(id_mesa: int):
    return Buscar_mesa(id_mesa)

#QUERY - usando diferente endpoint para evitar conflictos
@router.get("/mesa/buscar")
async def buscar_mesa_query(id_mesa: int):
    return Buscar_mesa(id_mesa)

#POST
@router.post("/mesa/", response_model=Mesa)
async def crear_mesa(mesa: Mesa):
    # Verificar si ya existe una mesa con el mismo ID
    try:
        existing_mesa = Buscar_mesa(mesa.id_mesa)
        if existing_mesa:
            raise HTTPException(status_code=400, detail="La mesa ya existe")
    except HTTPException as e:
        if e.status_code != 404:
            raise e
    
    mesas_list.append(mesa)
    # Enviar notificación al WebSocket (no-bloqueante)
    import asyncio
    try:
        asyncio.create_task(broadcast_mesas("mesa_creada", {
            "id_mesa": mesa.id_mesa,
            "numero": mesa.numero,
            "capacidad": mesa.capacidad,
            "estado": mesa.estado
        }))
    except Exception as e:
        print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
    return mesa

#PUT
@router.put("/mesa/")
async def actualizar_mesa(mesa: Mesa):
    found = False
    persona_asignada = None
    
    for index, guardar_mesa in enumerate(mesas_list):
        if guardar_mesa.id_mesa == mesa.id_mesa:
            estado_anterior = guardar_mesa.estado
            mesas_list[index] = mesa
            found = True
            
            # Enviar notificación al WebSocket
            import asyncio
            try:
                asyncio.create_task(broadcast_mesas("update_status", {
                    "mesa_id": mesa.id_mesa,
                    "numero": mesa.numero,
                    "capacidad": mesa.capacidad,
                    "estado": mesa.estado,
                    "estado_anterior": estado_anterior
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            
            # *** ASIGNACIÓN AUTOMÁTICA DE FILA VIRTUAL ***
            # Si la mesa pasó a "disponible", buscar siguiente en cola
            if estado_anterior != "disponible" and mesa.estado == "disponible":
                persona_asignada = await asignar_siguiente_en_cola(mesa)
            
            resultado = {"message": "Mesa actualizada exitosamente", "mesa": mesa}
            if persona_asignada:
                resultado["asignacion_automatica"] = {
                    "persona_nombre": persona_asignada.nombre,
                    "persona_id": persona_asignada.id,
                    "mensaje": f"Se notificó a {persona_asignada.nombre} que su mesa está lista"
                }
            
            return resultado
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la mesa")

# Endpoint para cambiar estado de mesa fácilmente
@router.put("/mesa/{id_mesa}/estado")
async def cambiar_estado_mesa(id_mesa: int, nuevo_estado: str = Query(...)):
    """Cambia el estado de una mesa (disponible, ocupada, reservada, mantenimiento)"""
    if nuevo_estado not in ESTADOS_MESA:
        raise HTTPException(status_code=400, detail={
            'error': 'Estado inválido',
            'estados_validos': ESTADOS_MESA
        })
    
    for mesa in mesas_list:
        if mesa.id_mesa == id_mesa:
            estado_anterior = mesa.estado
            mesa.estado = nuevo_estado
            
            import asyncio
            persona_asignada = None
            
            try:
                asyncio.create_task(broadcast_mesas("cambio_estado", {
                    "mesa_id": id_mesa,
                    "estado_anterior": estado_anterior,
                    "estado_nuevo": nuevo_estado
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            
            # Asignación automática si pasa a disponible
            if estado_anterior != "disponible" and nuevo_estado == "disponible":
                persona_asignada = await asignar_siguiente_en_cola(mesa)
            
            resultado = {
                "message": f"Estado cambiado de '{estado_anterior}' a '{nuevo_estado}'",
                "mesa": mesa
            }
            if persona_asignada:
                resultado["asignacion_automatica"] = {
                    "persona_nombre": persona_asignada.nombre,
                    "mensaje": f"Se notificó a {persona_asignada.nombre}"
                }
            
            return resultado
    
    raise HTTPException(status_code=404, detail="Mesa no encontrada")

# Endpoint para obtener estadísticas de mesas
@router.get("/mesas/estadisticas")
async def get_estadisticas_mesas():
    """Obtiene estadísticas de mesas"""
    return {
        "total": len(mesas_list),
        "disponibles": len([m for m in mesas_list if m.estado == "disponible"]),
        "ocupadas": len([m for m in mesas_list if m.estado == "ocupada"]),
        "reservadas": len([m for m in mesas_list if m.estado == "reservada"]),
        "mantenimiento": len([m for m in mesas_list if m.estado == "mantenimiento"]),
        "capacidad_total": sum(m.capacidad for m in mesas_list),
        "capacidad_disponible": sum(m.capacidad for m in mesas_list if m.estado == "disponible")
    }

#Delete
@router.delete("/mesa/{id}")
async def eliminar_mesa(id: int):
    found = False
    for index, guardar_mesa in enumerate(mesas_list):
        if guardar_mesa.id_mesa == id:
            mesa_eliminada = mesas_list[index]
            del mesas_list[index]
            found = True
            # Enviar notificación al WebSocket (no-bloqueante)
            import asyncio
            try:
                asyncio.create_task(broadcast_mesas("mesa_eliminada", {
                    "id_mesa": mesa_eliminada.id_mesa,
                    "numero": mesa_eliminada.numero,
                    "capacidad": mesa_eliminada.capacidad,
                    "estado": mesa_eliminada.estado
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            return {
                "message": "Mesa eliminada exitosamente",
                "mesa_eliminada": {
                    "id_mesa": mesa_eliminada.id_mesa,
                    "numero": mesa_eliminada.numero,
                    "capacidad": mesa_eliminada.capacidad
                }
            }
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la mesa")

#funciones
def Buscar_mesa(id_mesa: int):
    mesas = filter(lambda mesa: mesa.id_mesa == id_mesa, mesas_list)
    try:
        result = list(mesas)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Mesa no encontrada")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado la mesa")
