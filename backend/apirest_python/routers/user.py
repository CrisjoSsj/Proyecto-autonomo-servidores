from fastapi import APIRouter, HTTPException
from pydantic import BaseModel 

router = APIRouter(tags=["user"])

#entid_clientead de user
class User(BaseModel):
    id_cliente: int
    nombre: str
    correo: str
    telefono: str

users_list = [User(id_cliente=1, nombre="crisjo", correo= "correo1", telefono="123"),
              User(id_cliente=2, nombre="victoria", correo= "correo2", telefono="456"),
              User(id_cliente=3, nombre="kilian", correo= "correo3", telefono="789")]


@router.get("/user/")
async def users ():
    return {"api user activo"}

@router.get("/users/")
async def users ():
    return users_list

#path
@router.get ("/user/{id_cliente}")
async def user (id_cliente: int):
    return Buscar_usuario(id_cliente)

#QUERY
@router.get ("/user/")
async def user (id_cliente: int):
    return Buscar_usuario(id_cliente)


#POST
@router.post ("/user/", response_model=User,)
async def user (user: User):
    if type (Buscar_usuario(user.id_cliente)) ==User:
        raise HTTPException(status_code=400, detail="Error usuario ya existe")
    else:
        users_list.append(user)
        return user
 
#PUT
@router.put ("/user/")
async def user (user: User):
    found= False
    for index, guardar_user in enumerate(users_list):
        if guardar_user.id_cliente == user.id_cliente:
            users_list[index] = user
            found= True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el usuario")

#Delete
@router.delete ("/user/{id}")
async def user (id: int):
    found= False
    for index, guardar_user in enumerate(users_list):
        if guardar_user.id_cliente == id:
            del users_list[index]
            found= True
            return{"Eliminado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el usuario")

#funciones
def Buscar_usuario(id_cliente: int):
    users = filter(lambda user: user.id_cliente == id_cliente, users_list)
    try:
        result = list(users)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    except:
        raise HTTPException(status_code=404, detail="Error, no se ha encontrado el usuario")
    

