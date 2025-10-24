from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import user, Restaurante, Reserva, Menu, Plato, Mesa, FilaVirtual, Cliente, CategoriaMenu, Dashboard, auth

app = FastAPI()

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # URLs del frontend
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],  # Permitir todos los headers
)

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
app.include_router(Dashboard.router)

@app.get("/")
def root():
    return {"api-rest activo"}