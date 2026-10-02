from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


SECRET_KEY = "clave_super_secreta_sistema_logistica_2026"
ALGORITHM = "HS256"


def hashear_password(password: str):
    return pwd_context.hash(password)


def verificar_password(
    password_plano: str,
    password_hash: str
):
    return pwd_context.verify(
        password_plano,
        password_hash
    )


def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credenciales_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        usuario_id = payload.get("sub")

        if usuario_id is None:
            raise credenciales_exception

    except JWTError:
        raise credenciales_exception

    usuario = db.query(Usuario).filter(
        Usuario.id == int(usuario_id)
    ).first()

    if usuario is None:
        raise credenciales_exception

    return usuario

def verificar_rol(usuario, roles_permitidos):
    if not usuario.rol:
        raise HTTPException(
            status_code=403,
            detail="El usuario no tiene un rol asignado"
        )

    if usuario.rol.nombre not in roles_permitidos:
        raise HTTPException(
            status_code=403,
            detail="No tiene permisos para realizar esta acción"
        )

    return usuario