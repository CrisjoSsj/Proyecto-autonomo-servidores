from fastapi import FastAPI
from pydantic import BaseModel

router= FastAPI (tags=["CategoriaMenu"])

class CategoriaMenu(BaseModel):
    id_categoria: str
    nombre: str
