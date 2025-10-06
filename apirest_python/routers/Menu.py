from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router= APIRouter (tags=["Menu"])

class Menu(BaseModel):
    id_menu: int
    fecha: str
'''    platos: plato[]'''

menus_list = [Menu(id_menu=1, fecha="2024-10-05"),
              Menu(id_menu=2, fecha="2024-10-06"),
              Menu(id_menu=3, fecha="2024-10-07")]

@router.get("/menu/")
async def menu():
    return {"api menu activa"}

@router.get("/menus/")
async def menus():
    return menus_list

#path
@router.get("/menu/{id_menu}")
async def menu(id_menu: int):
    return Buscar_menu(id_menu)

#QUERY
@router.get("/menu/")
async def menu(id_menu: int):
    return Buscar_menu(id_menu)

#POST
@router.post("/menu/", response_model=Menu)
async def menu(menu: Menu):
    if type(Buscar_menu(menu.id_menu)) == Menu:
        raise HTTPException(status_code=400, detail="El menú ya existe")
    else:
        menus_list.append(menu)
        return menu

#PUT
@router.put("/menu/")
async def menu(menu: Menu):
    found = False
    for index, guardar_menu in enumerate(menus_list):
        if guardar_menu.id_menu == menu.id_menu:
            menus_list[index] = menu
            found = True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el menú")

#Delete
@router.delete("/menu/{id}")
async def menu(id: int):
    found = False
    for index, guardar_menu in enumerate(menus_list):
        if guardar_menu.id_menu == id:
            del menus_list[index]
            found = True
            return {"Eliminado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el menú")

#funciones
def Buscar_menu(id_menu: int):
    menus = filter(lambda menu: menu.id_menu == id_menu, menus_list)
    try:
        result = list(menus)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Menú no encontrado")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado el menú")