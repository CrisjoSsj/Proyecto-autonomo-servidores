from fastapi import FastAPI
from pydantic import BaseModel

router= FastAPI (tags=["Plato"])

class Plato(BaseModel):
    id_plato: str
    nombre: str
    descripcion: str
    precio: str
    estado: str
'''    Categoria: CategoriaMenu'''

