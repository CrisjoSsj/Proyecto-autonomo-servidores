from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_reservas

router= APIRouter (tags=["Reserva"])

class Reserva(BaseModel):
    id_reserva: int
    id_cliente: int
    id_mesa: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    estado: str
'''    cliente: Cliente'''
'''    mesa: Mesa'''   

reservas_list = [Reserva(id_reserva=1, id_cliente=1, id_mesa=1, fecha="2024-10-05", hora_inicio="19:00", hora_fin="21:00", estado="confirmada"),
                 Reserva(id_reserva=2, id_cliente=2, id_mesa=2, fecha="2024-10-06", hora_inicio="20:00", hora_fin="22:00", estado="pendiente"),
                 Reserva(id_reserva=3, id_cliente=3, id_mesa=3, fecha="2024-10-07", hora_inicio="18:30", hora_fin="20:30", estado="cancelada")]

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

#POST
@router.post("/reserva/", response_model=Reserva)
async def crear_reserva(reserva: Reserva):
    # Verificar si ya existe una reserva con el mismo ID
    try:
        existing_reserva = Buscar_reserva(reserva.id_reserva)
        if existing_reserva:
            raise HTTPException(status_code=400, detail="La reserva ya existe")
    except HTTPException as e:
        # Si no existe, continuamos (esto es lo que queremos)
        if e.status_code != 404:
            raise e
    
    # Agregar la nueva reserva
    reservas_list.append(reserva)
    
    # Enviar notificación al WebSocket
    try:
        await broadcast_reservas("new_reservation", {
            "reserva_id": reserva.id_reserva,
            "cliente_id": reserva.id_cliente,
            "mesa_id": reserva.id_mesa,
            "fecha": reserva.fecha,
            "hora_inicio": reserva.hora_inicio,
            "estado": reserva.estado
        })
    except Exception as ws_error:
        # Si el WebSocket falla, no afectar la creación de la reserva
        print(f"Warning: WebSocket broadcast failed: {ws_error}")
    
    return reserva

#PUT
@router.put("/reserva/")
async def actualizar_reserva(reserva: Reserva):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == reserva.id_reserva:
            reservas_list[index] = reserva
            found = True
            # Enviar notificación al WebSocket
            try:
                await broadcast_reservas("update_reservation", {
                    "reserva_id": reserva.id_reserva,
                    "estado": reserva.estado,
                    "fecha": reserva.fecha,
                    "hora_inicio": reserva.hora_inicio
                })
            except Exception as ws_error:
                print(f"Warning: WebSocket broadcast failed: {ws_error}")
            return {"message": "Reserva actualizada exitosamente", "reserva": reserva}
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la reserva")

#Delete
@router.delete("/reserva/{id}")
async def eliminar_reserva(id: int):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == id:
            reserva_eliminada = reservas_list[index]
            del reservas_list[index]
            found = True
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
