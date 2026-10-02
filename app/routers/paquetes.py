from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Paquete
from ..schemas import (
    PaqueteCreate,
    PaqueteResponse,
    PaqueteUpdate
)

from ..security import (
    obtener_usuario_actual,
    verificar_rol
)

from datetime import datetime


router = APIRouter(
    prefix="/paquetes",
    tags=["Paquetes"]
)


def generar_numero_guia(db: Session):
    anio = datetime.now().year

    ultimo_paquete = db.query(Paquete).order_by(
        Paquete.id.desc()
    ).first()

    if ultimo_paquete:
        siguiente_id = ultimo_paquete.id + 1
    else:
        siguiente_id = 1

    return f"GUIA-{anio}-{siguiente_id:06d}"


@router.post(
    "/",
    response_model=PaqueteResponse,
    status_code=201
)
def crear_paquete(
    paquete: PaqueteCreate,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )

    numero_guia = generar_numero_guia(db)

    nuevo_paquete = Paquete(
        numero_guia=numero_guia,
        remitente=paquete.remitente,
        destinatario=paquete.destinatario,
        telefono_destinatario=paquete.telefono_destinatario,
        direccion_entrega=paquete.direccion_entrega,
        estado_pago=paquete.estado_pago,
        estado="En almacén"
    )

    db.add(nuevo_paquete)
    db.commit()
    db.refresh(nuevo_paquete)

    return nuevo_paquete


@router.get(
    "/",
    response_model=list[PaqueteResponse]
)
def listar_paquetes(
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )

    paquetes = db.query(Paquete).all()

    return paquetes


@router.get(
    "/{paquete_id}",
    response_model=PaqueteResponse
)
def obtener_paquete(
    paquete_id: int,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )

    paquete = db.query(Paquete).filter(
        Paquete.id == paquete_id
    ).first()

    if not paquete:
        raise HTTPException(
            status_code=404,
            detail="Paquete no encontrado"
        )

    return paquete


@router.put(
    "/{paquete_id}",
    response_model=PaqueteResponse
)
def actualizar_paquete(
    paquete_id: int,
    datos: PaqueteUpdate,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    verificar_rol(
        usuario_actual,
        ["Administrador", "Personal de oficina"]
    )

    paquete = db.query(Paquete).filter(
        Paquete.id == paquete_id
    ).first()

    if not paquete:
        raise HTTPException(
            status_code=404,
            detail="Paquete no encontrado"
        )

    if datos.estado is not None:
        estados_validos = [
            "En almacén",
            "En ruta",
            "Entregado"
        ]

        if datos.estado not in estados_validos:
            raise HTTPException(
                status_code=400,
                detail="Estado de paquete no válido"
            )

        paquete.estado = datos.estado

    if datos.estado_pago is not None:
        paquete.estado_pago = datos.estado_pago

    if datos.direccion_entrega is not None:
        paquete.direccion_entrega = datos.direccion_entrega

    if datos.telefono_destinatario is not None:
        paquete.telefono_destinatario = datos.telefono_destinatario

    db.commit()
    db.refresh(paquete)

    return paquete