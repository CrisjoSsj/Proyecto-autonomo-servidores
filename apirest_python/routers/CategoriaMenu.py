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
async def categoria():
    return {"api categoria activa"}

@router.get("/categorias/")
async def categorias():
    return categorias_list

#path
@router.get("/categoria/{id_categoria}")
async def categoria(id_categoria: int):
    return Buscar_categoria(id_categoria)

#QUERY
@router.get("/categoria/")
async def categoria(id_categoria: int):
    return Buscar_categoria(id_categoria)

#POST
@router.post("/categoria/", response_model=CategoriaMenu)
async def categoria(categoria: CategoriaMenu):
    if type(Buscar_categoria(categoria.id_categoria)) == CategoriaMenu:
        raise HTTPException(status_code=400, detail="La categoría ya existe")
    else:
        categorias_list.append(categoria)
        return categoria

#PUT
@router.put("/categoria/")
async def categoria(categoria: CategoriaMenu):
    found = False
    for index, guardar_categoria in enumerate(categorias_list):
        if guardar_categoria.id_categoria == categoria.id_categoria:
            categorias_list[index] = categoria
            found = True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la categoría")

#Delete
@router.delete("/categoria/{id}")
async def categoria(id: int):
    found = False
    for index, guardar_categoria in enumerate(categorias_list):
        if guardar_categoria.id_categoria == id:
            del categorias_list[index]
            found = True
            return {"Eliminado exitosamente"}
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
