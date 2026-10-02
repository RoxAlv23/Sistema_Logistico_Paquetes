from fastapi import FastAPI

from .database import engine, Base
from . import models
from .routers import (
    usuarios,
    auth,
    paquetes,
    rutas,
    entregas,
    comprobantes,
    seguimiento,
    ubicaciones
)

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Sistema Integrado de Gestión Logística",
    description="API REST para la gestión de paquetes y entregas",
    version="1.0.0"
)


app.include_router(
    usuarios.router
)

app.include_router(
    auth.router
)

app.include_router(
    paquetes.router
)

app.include_router(
    rutas.router
)

app.include_router(
    entregas.router
)

app.include_router(
    comprobantes.router
)

app.include_router(
    seguimiento.router
)

app.include_router(
    ubicaciones.router
)


@app.get("/")
def inicio():
    return {
        "mensaje": "API del Sistema Integrado de Gestión Logística funcionando"
    }