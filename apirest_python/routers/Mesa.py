from fastapi import FastAPI
from pydantic import BaseModel

router= FastAPI (tags=["Mesa"])

class Mesa(BaseModel):
    id_mesa: str
    numero: str
    capacidad: str
    estado: str
