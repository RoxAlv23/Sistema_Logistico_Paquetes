from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends

from ..database import get_db
from ..models import Paquete, Entrega
from ..schemas import SeguimientoResponse


router = APIRouter(
    prefix="/seguimiento",
    tags=["Seguimiento público"]
)


@router.get(
    "/{numero_guia}",
    response_model=SeguimientoResponse
)
def consultar_seguimiento(
    numero_guia: str,
    db: Session = Depends(get_db)
):
    paquete = db.query(Paquete).filter(
        Paquete.numero_guia == numero_guia
    ).first()

    if not paquete:
        raise HTTPException(
            status_code=404,
            detail="Número de guía no encontrado"
        )

    entrega = db.query(Entrega).filter(
        Entrega.paquete_id == paquete.id
    ).order_by(
        Entrega.fecha_hora.desc()
    ).first()

    return {
        "numero_guia": paquete.numero_guia,
        "destinatario": paquete.destinatario,
        "direccion_entrega": paquete.direccion_entrega,
        "estado": paquete.estado,
        "fecha_registro": paquete.fecha_registro,
        "fecha_entrega": entrega.fecha_hora if entrega else None
    }