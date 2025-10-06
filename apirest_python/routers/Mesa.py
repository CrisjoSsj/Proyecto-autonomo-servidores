from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router= APIRouter (tags=["Mesa"])

class Mesa(BaseModel):
    id_mesa: int
    numero: int
    capacidad: int
    estado: str

mesas_list = [Mesa(id_mesa=1, numero=1, capacidad=4, estado="disponible"),
              Mesa(id_mesa=2, numero=2, capacidad=2, estado="ocupada"),
              Mesa(id_mesa=3, numero=3, capacidad=6, estado="reservada")]

@router.get("/mesa/")
async def mesa():
    return {"api mesa activa"}

@router.get("/mesas/")
async def mesas():
    return mesas_list

#path
@router.get("/mesa/{id_mesa}")
async def mesa(id_mesa: int):
    return Buscar_mesa(id_mesa)

#QUERY
@router.get("/mesa/")
async def mesa(id_mesa: int):
    return Buscar_mesa(id_mesa)

#POST
@router.post("/mesa/", response_model=Mesa)
async def mesa(mesa: Mesa):
    if type(Buscar_mesa(mesa.id_mesa)) == Mesa:
        raise HTTPException(status_code=400, detail="La mesa ya existe")
    else:
        mesas_list.append(mesa)
        return mesa

#PUT
@router.put("/mesa/")
async def mesa(mesa: Mesa):
    found = False
    for index, guardar_mesa in enumerate(mesas_list):
        if guardar_mesa.id_mesa == mesa.id_mesa:
            mesas_list[index] = mesa
            found = True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la mesa")

#Delete
@router.delete("/mesa/{id}")
async def mesa(id: int):
    found = False
    for index, guardar_mesa in enumerate(mesas_list):
        if guardar_mesa.id_mesa == id:
            del mesas_list[index]
            found = True
            return {"Eliminado exitosamente"}
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
