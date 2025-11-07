from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_mesas

router= APIRouter (tags=["Mesa"])

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
    return mesa

#PUT
@router.put("/mesa/")
async def actualizar_mesa(mesa: Mesa):
    found = False
    for index, guardar_mesa in enumerate(mesas_list):
        if guardar_mesa.id_mesa == mesa.id_mesa:
            mesas_list[index] = mesa
            found = True
            # Enviar notificación al WebSocket
            try:
                await broadcast_mesas("update_status", {
                    "mesa_id": mesa.id_mesa,
                    "numero": mesa.numero,
                    "capacidad": mesa.capacidad,
                    "estado": mesa.estado
                })
            except Exception as ws_error:
                print(f"Warning: WebSocket broadcast failed: {ws_error}")
            return {"message": "Mesa actualizada exitosamente", "mesa": mesa}
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la mesa")

#Delete
@router.delete("/mesa/{id}")
async def eliminar_mesa(id: int):
    found = False
    for index, guardar_mesa in enumerate(mesas_list):
        if guardar_mesa.id_mesa == id:
            mesa_eliminada = mesas_list[index]
            del mesas_list[index]
            found = True
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
