from fastapi import FastAPI
from routers import user, Restaurante, Reserva, Menu, Plato, Mesa, FilaVirtual, Cliente, CategoriaMenu, auth

app = FastAPI()

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(Restaurante.router)
app.include_router(Reserva.router)
app.include_router(Menu.router)
app.include_router(Plato.router)
app.include_router(Mesa.router)
app.include_router(FilaVirtual.router)
app.include_router(Cliente.router)
app.include_router(CategoriaMenu.router)

@app.get("/")
def root():
    return {"api-rest activo"}