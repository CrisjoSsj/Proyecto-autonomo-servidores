from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_fila_virtual

router= APIRouter (tags=["FilaVirtual"])

class FilaVirtual(BaseModel):
    id_fila: Optional[int] = None
    id_cliente: Optional[int] = None
    posicion: Optional[int] = None
    tiempo_espera: Optional[str] = None
    estado: Optional[str] = 'esperando'

filas_list = [FilaVirtual(id_fila=1, id_cliente=1, posicion=1, tiempo_espera="15 min", estado="esperando"),
              FilaVirtual(id_fila=2, id_cliente=2, posicion=2, tiempo_espera="30 min", estado="esperando"),
              FilaVirtual(id_fila=3, id_cliente=3, posicion=3, tiempo_espera="45 min", estado="esperando")]

@router.get("/fila/")
async def fila():
    return {"api fila virtual activa"}

@router.get("/filas/")
async def filas():
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
    # Generar id_fila automáticamente si no fue provisto
    max_id = 0
    for existing in filas_list:
        if existing.id_fila and existing.id_fila > max_id:
            max_id = existing.id_fila

    if fila.id_fila is None:
        fila.id_fila = max_id + 1

    # Comprobar existencia por id_fila ahora que tenemos id asignado
    exists = any(guardar_fila.id_fila == fila.id_fila for guardar_fila in filas_list)
    if exists:
        raise HTTPException(status_code=400, detail="La fila ya existe")

    # Asignar posición si no fue provista
    if fila.posicion is None:
        fila.posicion = len(filas_list) + 1

    # Asegurar tiempo_espera por defecto
    if fila.tiempo_espera is None:
        fila.tiempo_espera = "15 min"

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