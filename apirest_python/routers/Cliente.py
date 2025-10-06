from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router= APIRouter (tags=["Cliente"])

class Cliente(BaseModel):
    id_cliente: int
    nombre: str
    correo: str
    telefono: str

clientes_list = [Cliente(id_cliente=1, nombre="Ana García", correo="ana@email.com", telefono="555-0001"),
                 Cliente(id_cliente=2, nombre="Luis Pérez", correo="luis@email.com", telefono="555-0002"),
                 Cliente(id_cliente=3, nombre="María López", correo="maria@email.com", telefono="555-0003")]

@router.get("/cliente/")
async def cliente():
    return {"api cliente activa"}

@router.get("/clientes/")
async def clientes():
    return clientes_list

#path
@router.get("/cliente/{id_cliente}")
async def cliente(id_cliente: int):
    return Buscar_cliente(id_cliente)

#QUERY
@router.get("/cliente/")
async def cliente(id_cliente: int):
    return Buscar_cliente(id_cliente)

#POST
@router.post("/cliente/", response_model=Cliente)
async def cliente(cliente: Cliente):
    if type(Buscar_cliente(cliente.id_cliente)) == Cliente:
        raise HTTPException(status_code=400, detail="El cliente ya existe")
    else:
        clientes_list.append(cliente)
        return cliente

#PUT
@router.put("/cliente/")
async def cliente(cliente: Cliente):
    found = False
    for index, guardar_cliente in enumerate(clientes_list):
        if guardar_cliente.id_cliente == cliente.id_cliente:
            clientes_list[index] = cliente
            found = True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el cliente")

#Delete
@router.delete("/cliente/{id}")
async def cliente(id: int):
    found = False
    for index, guardar_cliente in enumerate(clientes_list):
        if guardar_cliente.id_cliente == id:
            del clientes_list[index]
            found = True
            return {"Eliminado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró el cliente")

#funciones
def Buscar_cliente(id_cliente: int):
    clientes = filter(lambda cliente: cliente.id_cliente == id_cliente, clientes_list)
    try:
        result = list(clientes)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado el cliente")

