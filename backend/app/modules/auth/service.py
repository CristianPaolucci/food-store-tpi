from fastapi import HTTPException, status
from app.core.security import verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork):
        self.uow = uow

    def autenticar_usuario(self, username: str, password: str) -> Usuario:
        with self.uow as uow:
            user = uow.usuarios.get_by_username(username)
            if not user or not verify_password(password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales incorrectas",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            if user.disabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El usuario se encuentra desactivado"
                )
            
            # CRUCIAL: Desvincula la instancia para poder leer sus atributos (como username) fuera de la sesión
            uow.session.expunge(user)
            return user