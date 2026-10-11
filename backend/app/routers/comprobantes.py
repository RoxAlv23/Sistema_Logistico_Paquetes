from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Comprobante, Entrega
from ..schemas import (
    ComprobanteCreate,
    ComprobanteResponse
)
from ..security import obtener_usuario_actual


router = APIRouter(
    prefix="/comprobantes",
    tags=["Comprobantes"]
)


@router.post(
    "/",
    response_model=ComprobanteResponse,
    status_code=201
)
def crear_comprobante(
    datos: ComprobanteCreate,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    entrega = db.query(Entrega).filter(
        Entrega.id == datos.entrega_id
    ).first()

    if not entrega:
        raise HTTPException(
            status_code=404,
            detail="Entrega no encontrada"
        )

    comprobante_existente = db.query(Comprobante).filter(
        Comprobante.entrega_id == datos.entrega_id
    ).first()

    if comprobante_existente:
        raise HTTPException(
            status_code=400,
            detail="La entrega ya tiene un comprobante"
        )

    nuevo_comprobante = Comprobante(
        entrega_id=datos.entrega_id,
        foto=datos.foto,
        latitud=datos.latitud,
        longitud=datos.longitud
    )

    db.add(nuevo_comprobante)
    db.commit()
    db.refresh(nuevo_comprobante)

    return nuevo_comprobante


@router.get(
    "/",
    response_model=list[ComprobanteResponse]
)
def listar_comprobantes(
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    comprobantes = db.query(Comprobante).all()

    return comprobantes


@router.get(
    "/{comprobante_id}",
    response_model=ComprobanteResponse
)
def obtener_comprobante(
    comprobante_id: int,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    comprobante = db.query(Comprobante).filter(
        Comprobante.id == comprobante_id
    ).first()

    if not comprobante:
        raise HTTPException(
            status_code=404,
            detail="Comprobante no encontrado"
        )

    return comprobante