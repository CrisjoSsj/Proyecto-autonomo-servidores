from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router= APIRouter (tags=["Plato"])

class Plato(BaseModel):
    id_plato: int
    nombre: str
    descripcion: str
    precio: float
    estado: str
    id_categoria: int  # Agregar referencia a categoría
    disponible: bool = True  # Campo adicional para frontend
'''    Categoria: CategoriaMenu'''

platos_list = [
    Plato(id_plato=1, nombre="Ceviche", descripcion="Pescado fresco marinado", precio=25.50, estado="disponible", id_categoria=1, disponible=True),
    Plato(id_plato=2, nombre="Tequeños", descripcion="Palitos de queso envueltos en masa", precio=18.00, estado="disponible", id_categoria=1, disponible=True),
    Plato(id_plato=3, nombre="Lomo Saltado", descripcion="Carne salteada con papas y verduras", precio=32.00, estado="disponible", id_categoria=2, disponible=True),
    Plato(id_plato=4, nombre="Parrilla Mixta", descripcion="Selección de carnes a la parrilla", precio=45.00, estado="disponible", id_categoria=2, disponible=True),
    Plato(id_plato=5, nombre="Pollo a la Brasa", descripcion="Pollo entero con papas y ensalada", precio=28.00, estado="disponible", id_categoria=2, disponible=True),  
    Plato(id_plato=6, nombre="Suspiro Limeño", descripcion="Postre tradicional peruano", precio=15.00, estado="disponible", id_categoria=3, disponible=True),
    Plato(id_plato=7, nombre="Tres Leches", descripcion="Torta húmeda con tres tipos de leche", precio=12.50, estado="disponible", id_categoria=3, disponible=True),
    Plato(id_plato=8, nombre="Anticuchos", descripcion="Brochetas de corazón marinado", precio=22.00, estado="disponible", id_categoria=1, disponible=True),
]

@router.get("/plato/")
async def plato():
    return {"api plato activa"}

@router.get("/platos/")
async def platos():
    return platos_list

#path
@router.get("/plato/{id_plato}")
async def plato(id_plato: int):
    return Buscar_plato(id_plato)

#QUERY
@router.get("/plato/")
async def plato(id_plato: int):
    return Buscar_plato(id_plato)

#POST
@router.post("/plato/", response_model=Plato)
async def plato(plato: Plato):
    if type(Buscar_plato(plato.id_plato)) == Plato:
        raise HTTPException(status_code=400, detail="El plato ya existe")
    else:
        platos_list.append(plato)
        return plato

#PUT
@router.put("/plato/")
async def plato(plato: Plato):
    found = False
    for index, guardar_plato in enumerate(platos_list):
        if guardar_plato.id_plato == plato.id_plato:
            platos_list[index] = plato
            found = True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el plato")

#Delete
@router.delete("/plato/{id}")
async def plato(id: int):
    found = False
    for index, guardar_plato in enumerate(platos_list):
        if guardar_plato.id_plato == id:
            del platos_list[index]
            found = True
            return {"Eliminado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el plato")

#funciones
def Buscar_plato(id_plato: int):
    platos = filter(lambda plato: plato.id_plato == id_plato, platos_list)
    try:
        result = list(platos)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Plato no encontrado")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado el plato")

