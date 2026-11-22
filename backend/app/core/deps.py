from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select
from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token", auto_error=False)

COOKIE_TOKEN_NAMES = ("access_token", "token", "session")


def _extraer_token(request: Request, bearer_token: str | None) -> str | None:
    if bearer_token:
        return bearer_token
    for cookie_name in COOKIE_TOKEN_NAMES:
        cookie_val = request.cookies.get(cookie_name)
        if cookie_val:
            # Por si el valor viene prefijado con "Bearer "
            if cookie_val.lower().startswith("bearer "):
                return cookie_val.split(" ", 1)[1].strip()
            return cookie_val
    return None


def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    resolved_token = _extraer_token(request, token)
    if not resolved_token:
        raise credentials_exception

    try:
        payload = decode_access_token(resolved_token)
        if payload is None:
            raise credentials_exception

        # Compatibilidad por si el payload es dict o string plano
        if isinstance(payload, dict):
            username: str | None = payload.get("sub")
        else:
            username = str(payload)

        if not username:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    with session_factory() as db:
        statement = select(Usuario).where(Usuario.username == username)
        user = db.exec(statement).first()
        if user is None:
            raise credentials_exception
        return user


def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta de usuario desactivada",
        )
    return current_user


def require_role(roles: list[str]):
    def role_dependency(current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No cuenta con los permisos necesarios para realizar esta acción",
            )
        return current_user

    return role_dependency


# Clase RoleChecker para satisfacer las importaciones de los routers de dominio
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No cuenta con los permisos necesarios para realizar esta acción",
            )
        return current_user