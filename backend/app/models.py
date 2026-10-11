from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    Float,
    ForeignKey,
    Numeric
)

from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)

    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True)

    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    rol = relationship("Rol", back_populates="usuarios")
    rutas = relationship("Ruta", back_populates="repartidor")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(150),
        nullable=False
    )

    telefono = Column(
        String(30),
        nullable=False
    )

    direccion = Column(
        Text,
        nullable=False
    )

    paquetes = relationship(
        "Paquete",
        back_populates="cliente"
    )


class Paquete(Base):
    __tablename__ = "paquetes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    numero_guia = Column(
        String(30),
        unique=True,
        nullable=False,
        index=True
    )

    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=False
    )

    remitente = Column(
        String(150),
        nullable=False
    )

    destinatario = Column(
        String(150),
        nullable=False
    )

    telefono_destinatario = Column(
        String(30),
        nullable=False
    )

    direccion_entrega = Column(
        Text,
        nullable=False
    )

    total = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    estado_pago = Column(
        String(50),
        nullable=False
    )

    estado = Column(
        String(50),
        default="En almacén"
    )

    fecha_registro = Column(
        DateTime,
        default=datetime.utcnow
    )

    cliente = relationship(
        "Cliente",
        back_populates="paquetes"
    )

    entregas = relationship(
        "Entrega",
        back_populates="paquete"
    )

    asignacion = relationship(
        "Asignacion",
        back_populates="paquete",
        uselist=False
    )


class Ruta(Base):
    __tablename__ = "rutas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)

    fecha = Column(DateTime, default=datetime.utcnow)

    repartidor_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    repartidor = relationship(
        "Usuario",
        back_populates="rutas"
    )

    asignaciones = relationship(
        "Asignacion",
        back_populates="ruta"
    )


class Asignacion(Base):
    __tablename__ = "asignaciones"

    id = Column(Integer, primary_key=True, index=True)

    paquete_id = Column(
        Integer,
        ForeignKey("paquetes.id"),
        nullable=False
    )

    ruta_id = Column(
        Integer,
        ForeignKey("rutas.id"),
        nullable=False
    )

    paquete = relationship(
        "Paquete",
        back_populates="asignacion"
    )

    ruta = relationship(
        "Ruta",
        back_populates="asignaciones"
    )


class Entrega(Base):
    __tablename__ = "entregas"

    id = Column(Integer, primary_key=True, index=True)

    paquete_id = Column(
        Integer,
        ForeignKey("paquetes.id"),
        nullable=False
    )

    fecha_hora = Column(
        DateTime,
        default=datetime.utcnow
    )

    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)

    paquete = relationship(
        "Paquete",
        back_populates="entregas"
    )

    comprobante = relationship(
        "Comprobante",
        back_populates="entrega",
        uselist=False
    )


class Ubicacion(Base):
    __tablename__ = "ubicaciones"

    id = Column(Integer, primary_key=True, index=True)

    repartidor_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False
    )

    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)

    fecha_hora = Column(
        DateTime,
        default=datetime.utcnow
    )


class Comprobante(Base):
    __tablename__ = "comprobantes"

    id = Column(Integer, primary_key=True, index=True)

    entrega_id = Column(
        Integer,
        ForeignKey("entregas.id"),
        nullable=False
    )

    foto = Column(String(255), nullable=True)

    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)

    fecha_hora = Column(
        DateTime,
        default=datetime.utcnow
    )

    entrega = relationship(
        "Entrega",
        back_populates="comprobante"
    )