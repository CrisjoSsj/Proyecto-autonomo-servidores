from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router= APIRouter (tags=["Restaurante"])

class Restaurante(BaseModel):
    id_restaurante: int
    nombre: str
    direccion: str
    telefono: str
'''    mesas: Mesa
    reservas: Reserva
    menu: Menu
'''

lista_restaurantes= [Restaurante(id_restaurante=1, nombre="restaurante1", direccion="Calle 1", telefono="123"),
                     Restaurante(id_restaurante=2, nombre="restaurante2", direccion="Calle 2", telefono="987"),
                     Restaurante(id_restaurante=3, nombre="restaurante3", direccion="Calle 3", telefono="456")]

@router.get("/restaurante")
def get_restaurante():
    return {"Restaurante":"Restaurante activo"}

@router.get("/restaurantes")
def get_restaurantes():
    return lista_restaurantes

@router.get("/restaurante/{id_restaurante}")
async def restaurante(id_restaurante: int):
    return buscar_restaurante(id_restaurante)

@router.post("/restaurante/", response_model=Restaurante)
async def restaurante (restaurante: Restaurante):
    if type(buscar_restaurante(restaurante.id_restaurante))== Restaurante:
        raise HTTPException(status_code=400, detail="El restaurante ya existe")
    else:
        lista_restaurantes.append(restaurante)
        return restaurante

@router.put("/restaurante/")
async def restaurante (restaurante: Restaurante):
    found= False
    for index, guardar_restaurante in enumerate(lista_restaurantes):
        if guardar_restaurante.id_restaurante == restaurante.id_restaurante:
            lista_restaurantes[index] = restaurante
            found= True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el restaurante")
    
@router.delete("/restaurante/{id_restaurante}")
async def restaurante (id_restaurante: int):
    found= False
    for index, guardar_restaurante in enumerate(lista_restaurantes):
        if guardar_restaurante.id_restaurante == id_restaurante:
            del lista_restaurantes[index]
            found= True
            return {"Eliminado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el restaurante")
    
def buscar_restaurante(id_restaurante: int):
    restaurante= filter(lambda restaurante: restaurante.id_restaurante==id_restaurante, lista_restaurantes)
    try:
        result = list(restaurante)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado el restaurante")

