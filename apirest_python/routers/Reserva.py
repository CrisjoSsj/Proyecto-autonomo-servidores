from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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
async def reserva():
    return {"api reserva activa"}

@router.get("/reservas/")
async def reservas():
    return reservas_list

#path
@router.get("/reserva/{id_reserva}")
async def reserva(id_reserva: int):
    return Buscar_reserva(id_reserva)

#QUERY
@router.get("/reserva/")
async def reserva(id_reserva: int):
    return Buscar_reserva(id_reserva)

#POST
@router.post("/reserva/", response_model=Reserva)
async def reserva(reserva: Reserva):
    if type(Buscar_reserva(reserva.id_reserva)) == Reserva:
        raise HTTPException(status_code=400, detail="La reserva ya existe")
    else:
        reservas_list.append(reserva)
        return reserva

#PUT
@router.put("/reserva/")
async def reserva(reserva: Reserva):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == reserva.id_reserva:
            reservas_list[index] = reserva
            found = True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la reserva")

#Delete
@router.delete("/reserva/{id}")
async def reserva(id: int):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == id:
            del reservas_list[index]
            found = True
            return {"Eliminado exitosamente"}
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
