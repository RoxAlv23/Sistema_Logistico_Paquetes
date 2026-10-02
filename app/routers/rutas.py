from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ruta, Usuario, Paquete, Asignacion
from ..schemas import (
    RutaCreate,
    RutaResponse,
    AsignacionCreate,
    AsignacionResponse,
    RutaRepartidorResponse,
    PaqueteRepartidorResponse
)
from ..security import obtener_usuario_actual


router = APIRouter(
    prefix="/rutas",
    tags=["Rutas"]
)


@router.post(
    "/",
    response_model=RutaResponse,
    status_code=201
)
def crear_ruta(
    datos: RutaCreate,
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

    nueva_ruta = Ruta(
        nombre=datos.nombre,
        repartidor_id=datos.repartidor_id
    )

    db.add(nueva_ruta)
    db.commit()
    db.refresh(nueva_ruta)

    return nueva_ruta


@router.get(
    "/",
    response_model=list[RutaResponse]
)
def listar_rutas(
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    rutas = db.query(Ruta).all()

    return rutas


@router.get(
    "/asignaciones",
    response_model=list[AsignacionResponse]
)
def listar_asignaciones(
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    asignaciones = db.query(Asignacion).all()

    return asignaciones


@router.post(
    "/asignar-paquete",
    response_model=AsignacionResponse,
    status_code=201
)
def asignar_paquete(
    datos: AsignacionCreate,
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

    ruta = db.query(Ruta).filter(
        Ruta.id == datos.ruta_id
    ).first()

    if not ruta:
        raise HTTPException(
            status_code=404,
            detail="Ruta no encontrada"
        )

    asignacion_existente = db.query(Asignacion).filter(
        Asignacion.paquete_id == datos.paquete_id
    ).first()

    if asignacion_existente:
        raise HTTPException(
            status_code=400,
            detail="El paquete ya está asignado a una ruta"
        )

    nueva_asignacion = Asignacion(
        paquete_id=datos.paquete_id,
        ruta_id=datos.ruta_id
    )

    paquete.estado = "En ruta"

    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)

    return nueva_asignacion


@router.get(
    "/repartidor/{repartidor_id}",
    response_model=list[RutaRepartidorResponse]
)
def listar_rutas_repartidor(
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

    if not repartidor.rol or repartidor.rol.nombre != "Repartidor":
        raise HTTPException(
            status_code=400,
            detail="El usuario seleccionado no tiene rol de Repartidor"
        )

    rutas = db.query(Ruta).filter(
        Ruta.repartidor_id == repartidor_id
    ).order_by(
        Ruta.fecha.desc()
    ).all()

    return rutas


@router.get(
    "/repartidor/{repartidor_id}/paquetes",
    response_model=list[PaqueteRepartidorResponse]
)
def listar_paquetes_repartidor(
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

    if not repartidor.rol or repartidor.rol.nombre != "Repartidor":
        raise HTTPException(
            status_code=400,
            detail="El usuario seleccionado no tiene rol de Repartidor"
        )

    paquetes = db.query(Paquete).join(
        Asignacion,
        Asignacion.paquete_id == Paquete.id
    ).join(
        Ruta,
        Ruta.id == Asignacion.ruta_id
    ).filter(
        Ruta.repartidor_id == repartidor_id
    ).all()

    return paquetes


@router.get(
    "/{ruta_id}",
    response_model=RutaResponse
)
def obtener_ruta(
    ruta_id: int,
    usuario_actual=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db)
):

    ruta = db.query(Ruta).filter(
        Ruta.id == ruta_id
    ).first()

    if not ruta:
        raise HTTPException(
            status_code=404,
            detail="Ruta no encontrada"
        )

    return ruta

@router.get(
    "/repartidor/{repartidor_id}/entregas",
    response_model=list[PaqueteRepartidorResponse]
)
def listar_entregas_repartidor(
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

    if not repartidor.rol or repartidor.rol.nombre != "Repartidor":
        raise HTTPException(
            status_code=400,
            detail="El usuario seleccionado no tiene rol de Repartidor"
        )

    paquetes = db.query(Paquete).join(
        Asignacion,
        Asignacion.paquete_id == Paquete.id
    ).join(
        Ruta,
        Ruta.id == Asignacion.ruta_id
    ).filter(
        Ruta.repartidor_id == repartidor_id,
        Paquete.estado == "En ruta"
    ).all()

    return paquetes
