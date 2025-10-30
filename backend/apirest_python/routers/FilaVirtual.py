from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_fila_virtual

router= APIRouter (tags=["FilaVirtual"])

class FilaVirtual(BaseModel):
    id_fila: int
    id_cliente: int
    posicion: int
    tiempo_espera: str
    estado: str

filas_list = [FilaVirtual(id_fila=1, id_cliente=1, posicion=1, tiempo_espera="15 min", estado="esperando"),
              FilaVirtual(id_fila=2, id_cliente=2, posicion=2, tiempo_espera="30 min", estado="esperando"),
              FilaVirtual(id_fila=3, id_cliente=3, posicion=3, tiempo_espera="45 min", estado="esperando")]

@router.get("/fila/")
async def fila():
    return {"api fila virtual activa"}

@router.get("/filas/")
async def filas():
    return filas_list

# Alias para compatibilidad con frontend
@router.get("/fila-virtual/")
async def fila_virtual():
    return filas_list

#path
@router.get("/fila/{id_fila}")
async def fila(id_fila: int):
    return Buscar_fila(id_fila)

#QUERY
@router.get("/fila/")
async def fila(id_fila: int):
    return Buscar_fila(id_fila)

#POST
@router.post("/fila/", response_model=FilaVirtual)
async def fila(fila: FilaVirtual):
    if type(Buscar_fila(fila.id_fila)) == FilaVirtual:
        raise HTTPException(status_code=400, detail="La fila ya existe")
    else:
        filas_list.append(fila)
        # Enviar notificación al WebSocket
        await broadcast_fila_virtual("join", {
            "cliente_id": fila.id_cliente,
            "posicion": fila.posicion,
            "tiempo_espera": fila.tiempo_espera,
            "estado": fila.estado
        })
        return fila

#PUT
@router.put("/fila/")
async def fila(fila: FilaVirtual):
    found = False
    for index, guardar_fila in enumerate(filas_list):
        if guardar_fila.id_fila == fila.id_fila:
            filas_list[index] = fila
            found = True
            return {"actualizado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la fila")

#Delete
@router.delete("/fila/{id}")
async def fila(id: int):
    found = False
    for index, guardar_fila in enumerate(filas_list):
        if guardar_fila.id_fila == id:
            # Enviar notificación al WebSocket antes de eliminar
            await broadcast_fila_virtual("leave", {
                "cliente_id": guardar_fila.id_cliente,
                "id_fila": id
            })
            del filas_list[index]
            found = True
            return {"Eliminado exitosamente"}
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la fila")

#funciones
def Buscar_fila(id_fila: int):
    filas = filter(lambda fila: fila.id_fila == id_fila, filas_list)
    try:
        result = list(filas)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Fila no encontrada")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado la fila")