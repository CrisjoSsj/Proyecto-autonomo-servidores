from fastapi import FastAPI
from pydantic import BaseModel

router= FastAPI (tags=["Reserva"])

class Reserva(BaseModel):
    id_reserva: int
    id_cliente: int
    id_mesa: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    estado: str
'''    cliente: Cliente'''
'''    mesa: Mesa'''   
