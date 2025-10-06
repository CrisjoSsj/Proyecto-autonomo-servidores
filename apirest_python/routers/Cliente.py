from fastapi import FastAPI
from pydantic import BaseModel

router= FastAPI (tags=["Cliente"])

class Cliente(BaseModel):
    id_cliente: int
    nombre: str
    correo: str
    telefono: str

