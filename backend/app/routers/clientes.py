
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cliente
from ..security import (
    obtener_usuario_actual,
    verificar_rol
)

from pydantic import BaseModel


router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"]
)


class ClienteCreate(BaseModel):
    nombre: str
    telefono: str
    direccion: str


class ClienteResponse(BaseModel):
    id: int
    nombre: str
    telefono: str
    direccion: str

    class Config:
        from_attributes = True


@router.get(
    "/",
    response_model=list[ClienteResponse]
)
def listar_clientes(
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )

    clientes = db.query(Cliente).order_by(
        Cliente.nombre.asc()
    ).all()

    return clientes


@router.get(
    "/{cliente_id}",
    response_model=ClienteResponse
)
def obtener_cliente(
    cliente_id: int,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente no encontrado"
        )

    return cliente


@router.post(
    "/",
    response_model=ClienteResponse,
    status_code=201
)
def crear_cliente(
    datos: ClienteCreate,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )

    nuevo_cliente = Cliente(
        nombre=datos.nombre,
        telefono=datos.telefono,
        direccion=datos.direccion
    )

    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)

    return nuevo_cliente

# ==========================================
# ACTUALIZAR CLIENTE
# ==========================================

class ClienteUpdate(BaseModel):

    nombre: str
    telefono: str
    direccion: str


@router.put(
    "/{cliente_id}",
    response_model=ClienteResponse
)
def actualizar_cliente(
    cliente_id: int,
    datos: ClienteUpdate,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )


    # Buscar cliente

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()


    if not cliente:

        raise HTTPException(
            status_code=404,
            detail="Cliente no encontrado"
        )


    # Actualizar datos

    cliente.nombre = datos.nombre

    cliente.telefono = datos.telefono

    cliente.direccion = datos.direccion


    # Guardar cambios

    db.commit()

    db.refresh(cliente)


    return cliente


