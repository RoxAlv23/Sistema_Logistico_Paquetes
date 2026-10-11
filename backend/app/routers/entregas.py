from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Entrega, Paquete
from ..schemas import EntregaCreate, EntregaResponse
from ..security import obtener_usuario_actual


router = APIRouter(
    prefix="/entregas",
    tags=["Entregas"]
)


@router.post(
    "/",
    response_model=EntregaResponse,
    status_code=201
)
def registrar_entrega(
    datos: EntregaCreate,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    paquete = db.query(Paquete).filter(
        Paquete.id == datos.paquete_id
    ).first()

    if not paquete:
        raise HTTPException(
            status_code=404,
            detail="Paquete no encontrado"
        )

    if paquete.estado == "Entregado":
        raise HTTPException(
            status_code=400,
            detail="El paquete ya fue entregado"
        )

    nueva_entrega = Entrega(
        paquete_id=datos.paquete_id,
        latitud=datos.latitud,
        longitud=datos.longitud
    )

    paquete.estado = "Entregado"

    db.add(nueva_entrega)
    db.commit()
    db.refresh(nueva_entrega)

    return nueva_entrega


@router.get(
    "/",
    response_model=list[EntregaResponse]
)
def listar_entregas(
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    entregas = db.query(Entrega).all()

    return entregas


@router.get(
    "/{entrega_id}",
    response_model=EntregaResponse
)
def obtener_entrega(
    entrega_id: int,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    entrega = db.query(Entrega).filter(
        Entrega.id == entrega_id
    ).first()

    if not entrega:
        raise HTTPException(
            status_code=404,
            detail="Entrega no encontrada"
        )

    return entrega