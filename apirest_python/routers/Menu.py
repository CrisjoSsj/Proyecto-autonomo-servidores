from fastapi import FastAPI
from pydantic import BaseModel

router= FastAPI (tags=["Menu"])

class Menu():
    id_menu: str
'''    fecha: str
    platos: plato[]'''