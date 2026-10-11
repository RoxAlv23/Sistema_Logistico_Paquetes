from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# =========================
# ROLES
# =========================

class RolBase(BaseModel):
    nombre: str


class RolCreate(RolBase):
    pass


class RolResponse(RolBase):
    id: int

    class Config:
        from_attributes = True


# =========================
# USUARIOS
# =========================

class UsuarioBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol_id: int


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    correo: EmailStr
    activo: bool
    rol_id: int

    class Config:
        from_attributes = True

class PaqueteBase(BaseModel):

    cliente_id: Optional[int] = None

    remitente: str

    destinatario: str

    telefono_destinatario: str

    direccion_entrega: str

    total: float

    estado_pago: str


class PaqueteCreate(PaqueteBase):
    pass

class PaqueteResponse(PaqueteBase):

    id: int

    numero_guia: str

    estado: str

    class Config:
        from_attributes = True


class PaqueteUpdate(BaseModel):

    cliente_id: Optional[int] = None

    estado: Optional[str] = None

    estado_pago: Optional[str] = None

    direccion_entrega: Optional[str] = None

    telefono_destinatario: Optional[str] = None

    total: Optional[float] = None


class RutaCreate(BaseModel):
    nombre: str
    repartidor_id: int


class RutaResponse(BaseModel):
    id: int
    nombre: str
    repartidor_id: int

    class Config:
        from_attributes = True


class AsignacionCreate(BaseModel):
    paquete_id: int
    ruta_id: int


class AsignacionResponse(BaseModel):
    id: int
    paquete_id: int
    ruta_id: int

    class Config:
        from_attributes = True

class EntregaCreate(BaseModel):
    paquete_id: int
    latitud: Optional[float] = None
    longitud: Optional[float] = None


class EntregaResponse(BaseModel):
    id: int
    paquete_id: int
    fecha_hora: datetime
    latitud: Optional[float] = None
    longitud: Optional[float] = None

    class Config:
        from_attributes = True

class ComprobanteCreate(BaseModel):
    entrega_id: int
    foto: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None


class ComprobanteResponse(BaseModel):
    id: int
    entrega_id: int
    foto: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    fecha_hora: datetime

    class Config:
        from_attributes = True

class SeguimientoResponse(BaseModel):

    numero_guia: str

    remitente: str

    destinatario: str

    telefono_destinatario: str

    direccion_entrega: str

    estado: str

    estado_pago: str

    fecha_registro: datetime

    fecha_entrega: Optional[datetime] = None

class UbicacionCreate(BaseModel):
    repartidor_id: int
    latitud: float
    longitud: float


class UbicacionResponse(BaseModel):
    id: int
    repartidor_id: int
    latitud: float
    longitud: float
    fecha_hora: datetime

    class Config:
        from_attributes = True

class RutaRepartidorResponse(BaseModel):
    id: int
    nombre: str
    repartidor_id: int
    fecha: datetime

    class Config:
        from_attributes = True

class PaqueteRepartidorResponse(BaseModel):
    id: int
    numero_guia: str
    remitente: str
    destinatario: str
    telefono_destinatario: str
    direccion_entrega: str
    estado_pago: str
    estado: str

    class Config:
        from_attributes = True