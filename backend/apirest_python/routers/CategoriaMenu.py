from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router= APIRouter (tags=["CategoriaMenu"])

class CategoriaMenu(BaseModel):
    id_categoria: int
    nombre: str

categorias_list = [CategoriaMenu(id_categoria=1, nombre="Entradas"),
                   CategoriaMenu(id_categoria=2, nombre="Platos principales"),
                   CategoriaMenu(id_categoria=3, nombre="Postres")]

@router.get("/categoria/")
async def categoria_status():
    return {"api categoria activa"}

@router.get("/categorias/")
async def get_categorias():
    return categorias_list

#path
@router.get("/categoria/{id_categoria}")
async def get_categoria_by_id(id_categoria: int):
    return Buscar_categoria(id_categoria)

#QUERY - usando diferente endpoint para evitar conflictos
@router.get("/categoria/buscar")
async def buscar_categoria_query(id_categoria: int):
    return Buscar_categoria(id_categoria)

#POST
@router.post("/categoria/", response_model=CategoriaMenu)
async def crear_categoria(categoria: CategoriaMenu):
    # Generar ID automáticamente
    if not categoria.id_categoria or categoria.id_categoria == 0:
        categoria.id_categoria = max([c.id_categoria for c in categorias_list]) + 1 if categorias_list else 1
    
    # Verificar si ya existe una categoría con el mismo ID
    try:
        existing_categoria = Buscar_categoria(categoria.id_categoria)
        if existing_categoria:
            raise HTTPException(status_code=400, detail="La categoría ya existe")
    except HTTPException as e:
        if e.status_code != 404:
            raise e
    
    categorias_list.append(categoria)
    return categoria

#PUT
@router.put("/categoria/{id_categoria}")
async def actualizar_categoria(id_categoria: int, categoria: CategoriaMenu):
    found = False
    for index, guardar_categoria in enumerate(categorias_list):
        if guardar_categoria.id_categoria == id_categoria:
            # Mantener el ID original
            categoria.id_categoria = id_categoria
            categorias_list[index] = categoria
            found = True
            return {"message": "Categoría actualizada exitosamente", "categoria": categoria}
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la categoría")

#Delete
@router.delete("/categoria/{id}")
async def eliminar_categoria(id: int):
    found = False
    for index, guardar_categoria in enumerate(categorias_list):
        if guardar_categoria.id_categoria == id:
            categoria_eliminada = categorias_list[index]
            del categorias_list[index]
            found = True
            return {
                "message": "Categoría eliminada exitosamente",
                "categoria_eliminada": {
                    "id_categoria": categoria_eliminada.id_categoria,
                    "nombre": categoria_eliminada.nombre
                }
            }
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la categoría")

#funciones
def Buscar_categoria(id_categoria: int):
    categorias = filter(lambda categoria: categoria.id_categoria == id_categoria, categorias_list)
    try:
        result = list(categorias)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado la categoría")
