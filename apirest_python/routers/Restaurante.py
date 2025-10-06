from fastapi import FastAPI
from pydantic import BaseModel

router= FastAPI (tags=["Restaurante"])

class Restaurante(BaseModel):
    id_restaurante: str
    nombre: str
    direccion: str
    telefono: str
'''    mesas: Mesa
    reservas: Reserva
    menu: Menu
'''