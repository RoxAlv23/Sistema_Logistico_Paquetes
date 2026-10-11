from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ubicacion, Usuario
from ..schemas import UbicacionCreate, UbicacionResponse
from ..security import obtener_usuario_actual


router = APIRouter(
    prefix="/ubicaciones",
    tags=["Ubicaciones GPS"]
)


@router.post(
    "/",
    response_model=UbicacionResponse,
    status_code=201
)
def registrar_ubicacion(
    datos: UbicacionCreate,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    repartidor = db.query(Usuario).filter(
        Usuario.id == datos.repartidor_id
    ).first()

    if not repartidor:
        raise HTTPException(
            status_code=404,
            detail="Repartidor no encontrado"
        )

    if not repartidor.activo:
        raise HTTPException(
            status_code=400,
            detail="El repartidor está inactivo"
        )

    if not repartidor.rol or repartidor.rol.nombre != "Repartidor":
        raise HTTPException(
            status_code=400,
            detail="El usuario seleccionado no tiene rol de Repartidor"
        )

    nueva_ubicacion = Ubicacion(
        repartidor_id=datos.repartidor_id,
        latitud=datos.latitud,
        longitud=datos.longitud
    )

    db.add(nueva_ubicacion)
    db.commit()
    db.refresh(nueva_ubicacion)

    return nueva_ubicacion


@router.get(
    "/",
    response_model=list[UbicacionResponse]
)
def listar_ubicaciones(
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    ubicaciones = db.query(Ubicacion).order_by(
        Ubicacion.fecha_hora.desc()
    ).all()

    return ubicaciones


@router.get(
    "/repartidor/{repartidor_id}",
    response_model=list[UbicacionResponse]
)
def listar_ubicaciones_repartidor(
    repartidor_id: int,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):
    repartidor = db.query(Usuario).filter(
        Usuario.id == repartidor_id
    ).first()

    if not repartidor:
        raise HTTPException(
            status_code=404,
            detail="Repartidor no encontrado"
        )

    ubicaciones = db.query(Ubicacion).filter(
        Ubicacion.repartidor_id == repartidor_id
    ).order_by(
        Ubicacion.fecha_hora.desc()
    ).all()

    return ubicaciones