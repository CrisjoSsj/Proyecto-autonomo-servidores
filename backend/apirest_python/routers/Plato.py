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
async def plato_status():
    return {"api plato activa"}

@router.get("/platos/")
async def get_platos():
    return platos_list

#path
@router.get("/plato/{id_plato}")
async def get_plato_by_id(id_plato: int):
    return Buscar_plato(id_plato)

#QUERY - usando diferente endpoint para evitar conflictos
@router.get("/plato/buscar")
async def buscar_plato_query(id_plato: int):
    return Buscar_plato(id_plato)

#POST
@router.post("/plato/", response_model=Plato)
async def crear_plato(plato: Plato):
    # Generar ID automáticamente
    if not plato.id_plato or plato.id_plato == 0:
        plato.id_plato = max([p.id_plato for p in platos_list]) + 1 if platos_list else 1
    
    # Verificar si ya existe un plato con el mismo ID
    try:
        existing_plato = Buscar_plato(plato.id_plato)
        if existing_plato:
            raise HTTPException(status_code=400, detail="El plato ya existe")
    except HTTPException as e:
        if e.status_code != 404:
            raise e
    
    platos_list.append(plato)
    return plato

#PUT
@router.put("/plato/{id_plato}")
async def actualizar_plato(id_plato: int, plato: Plato):
    found = False
    for index, guardar_plato in enumerate(platos_list):
        if guardar_plato.id_plato == id_plato:
            # Mantener el ID original
            plato.id_plato = id_plato
            platos_list[index] = plato
            found = True
            return {"message": "Plato actualizado exitosamente", "plato": plato}
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el plato")

#Delete
@router.delete("/plato/{id}")
async def eliminar_plato(id: int):
    found = False
    for index, guardar_plato in enumerate(platos_list):
        if guardar_plato.id_plato == id:
            plato_eliminado = platos_list[index]
            del platos_list[index]
            found = True
            return {
                "message": "Plato eliminado exitosamente",
                "plato_eliminado": {
                    "id_plato": plato_eliminado.id_plato,
                    "nombre": plato_eliminado.nombre
                }
            }
    
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

