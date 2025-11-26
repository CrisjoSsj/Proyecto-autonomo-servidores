from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
sys.path.append('..')
from websocket_broadcast import broadcast_reservas

router= APIRouter (tags=["Reserva"])

class Reserva(BaseModel):
    id_reserva: Optional[int] = None
    id_cliente: Optional[int] = None
    id_mesa: Optional[int] = None
    fecha: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    estado: Optional[str] = 'pendiente'
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    numero_personas: Optional[int] = None
    ocasion_especial: Optional[str] = None
    comentarios: Optional[str] = None
'''    cliente: Cliente'''
'''    mesa: Mesa'''   

reservas_list = []

@router.get("/reserva/")
async def reserva_status():
    return {"api reserva activa"}

@router.get("/reservas/")
async def get_reservas():
    return reservas_list

#path
@router.get("/reserva/{id_reserva}")
async def get_reserva_by_id(id_reserva: int):
    return Buscar_reserva(id_reserva)

#QUERY - usando diferente endpoint para evitar conflictos
@router.get("/reserva/buscar")
async def buscar_reserva_query(id_reserva: int):
    return Buscar_reserva(id_reserva)

#POST
@router.post("/reserva/", response_model=Reserva)
async def reserva(reserva: Reserva):
    # Generar id_reserva automáticamente si no fue provisto
    max_id = 0
    for existing in reservas_list:
        if existing.id_reserva and existing.id_reserva > max_id:
            max_id = existing.id_reserva

    # Forzar que el servidor genere el id_reserva (ignorar cualquier id enviado por el cliente)
    reserva.id_reserva = max_id + 1

    # Comprobar existencia por id_reserva (debería ser única tras generación)
    exists = any(r.id_reserva == reserva.id_reserva for r in reservas_list)
    if exists:
        # Muy improbable porque acabamos de generar un id nuevo, pero conservamos la comprobación
        raise HTTPException(status_code=400, detail="La reserva ya existe")

    # Validación mínima de campos obligatorios
    missing_fields = []
    if not reserva.fecha:
        missing_fields.append('fecha')
    if not reserva.hora_inicio:
        missing_fields.append('hora_inicio')
    if not reserva.id_mesa:
        missing_fields.append('id_mesa')

    if missing_fields:
        raise HTTPException(status_code=400, detail={
            'error': 'Faltan campos obligatorios',
            'missing': missing_fields
        })

    # Asegurar valores por defecto mínimos
    if reserva.estado is None:
        reserva.estado = 'pendiente'

    reservas_list.append(reserva)
    # Enviar notificación al WebSocket (no-bloqueante)
    import asyncio
    try:
        asyncio.create_task(broadcast_reservas("nueva_reserva", {
            "reserva_id": reserva.id_reserva,
            "cliente_id": reserva.id_cliente,
            "mesa_id": reserva.id_mesa,
            "fecha": reserva.fecha,
            "hora_inicio": reserva.hora_inicio,
            "estado": reserva.estado
        }))
    except Exception as e:
        print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
    return reserva

#PUT
@router.put("/reserva/")
async def actualizar_reserva(reserva: Reserva):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == reserva.id_reserva:
            reservas_list[index] = reserva
            found = True
            # Enviar notificación al WebSocket (no-bloqueante)
            import asyncio
            try:
                asyncio.create_task(broadcast_reservas("update_reservation", {
                    "reserva_id": reserva.id_reserva,
                    "estado": reserva.estado,
                    "fecha": reserva.fecha,
                    "hora_inicio": reserva.hora_inicio
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            return {"message": "Reserva actualizada exitosamente", "reserva": reserva}
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la reserva")

#Delete
@router.delete("/reserva/{id}")
async def eliminar_reserva(id: int):
    found = False
    for index, guardar_reserva in enumerate(reservas_list):
        if guardar_reserva.id_reserva == id:
            reserva_eliminada = reservas_list[index]
            del reservas_list[index]
            found = True
            # Enviar notificación al WebSocket (no-bloqueante)
            import asyncio
            try:
                asyncio.create_task(broadcast_reservas("reserva_eliminada", {
                    "reserva_id": reserva_eliminada.id_reserva,
                    "fecha": reserva_eliminada.fecha,
                    "hora_inicio": reserva_eliminada.hora_inicio
                }))
            except Exception as e:
                print(f"⚠️ Error en WebSocket broadcast: {str(e)}")
            return {
                "message": "Reserva eliminada exitosamente", 
                "reserva_eliminada": {
                    "id_reserva": reserva_eliminada.id_reserva,
                    "fecha": reserva_eliminada.fecha,
                    "hora_inicio": reserva_eliminada.hora_inicio
                }
            }
    
    if not found:
        raise HTTPException(status_code=404, detail="No se encontró la reserva")

#funciones
def Buscar_reserva(id_reserva: int):
    reservas = filter(lambda reserva: reserva.id_reserva == id_reserva, reservas_list)
    try:
        result = list(reservas)
        if result:
            return result[0]
        else:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
    except:
        raise HTTPException(status_code=404, detail="No se ha encontrado la reserva")   
