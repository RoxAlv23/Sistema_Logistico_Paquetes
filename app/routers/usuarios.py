from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..schemas import UsuarioCreate, UsuarioResponse
from ..security import hashear_password


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


# ==========================================
# ESQUEMA PARA EDITAR USUARIO
# ==========================================

class UsuarioUpdate(BaseModel):
    nombre: str
    correo: str
    rol_id: int
    activo: bool


# ==========================================
# LISTAR USUARIOS
# ==========================================

@router.get(
    "/",
    response_model=list[UsuarioResponse]
)
def listar_usuarios(
    db: Session = Depends(get_db)
):
    usuarios = db.query(Usuario).all()

    return usuarios


# ==========================================
# OBTENER UN USUARIO
# ==========================================

@router.get(
    "/{usuario_id}",
    response_model=UsuarioResponse
)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return usuario


# ==========================================
# CREAR USUARIO
# ==========================================

@router.post(
    "/",
    response_model=UsuarioResponse,
    status_code=201
)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):

    # Verificar correo existente
    usuario_existente = db.query(Usuario).filter(
        Usuario.correo == usuario.correo
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="El correo ya está registrado"
        )

    # Hashear contraseña
    password_hash = hashear_password(
        usuario.password
    )

    # Crear usuario
    nuevo_usuario = Usuario(
        nombre=usuario.nombre,
        correo=usuario.correo,
        password=password_hash,
        rol_id=usuario.rol_id,
        activo=True
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario


# ==========================================
# EDITAR USUARIO
# ==========================================

@router.put(
    "/{usuario_id}",
    response_model=UsuarioResponse
)
def editar_usuario(
    usuario_id: int,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db)
):

    # Buscar usuario
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    # Verificar si el correo pertenece
    # a otro usuario
    usuario_existente = db.query(Usuario).filter(
        Usuario.correo == datos.correo,
        Usuario.id != usuario_id
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="El correo ya está registrado por otro usuario"
        )

    # Actualizar datos
    usuario.nombre = datos.nombre
    usuario.correo = datos.correo
    usuario.rol_id = datos.rol_id
    usuario.activo = datos.activo

    db.commit()
    db.refresh(usuario)

    return usuario