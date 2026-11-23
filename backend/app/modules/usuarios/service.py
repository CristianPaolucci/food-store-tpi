from fastapi import HTTPException, status
from app.core.security import get_password_hash
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork):
        self.uow = uow

    def registrar_usuario(self, user_in: UserCreate) -> Usuario:
        with self.uow as uow:
            # Validar si ya existe el username
            if uow.usuarios.get_by_username(user_in.username):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El nombre de usuario ya está registrado",
                )
            # Validar si ya existe el email
            if uow.usuarios.get_by_email(user_in.email):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El correo electrónico ya está registrado",
                )

            hashed_pwd = get_password_hash(user_in.password)
            db_user = Usuario(
                username=user_in.username,
                email=user_in.email,
                hashed_password=hashed_pwd,
                role="user",
                disabled=False,
            )
            uow.usuarios.add(db_user)
            uow.session.flush()
            uow.session.refresh(db_user)

            # Evita el DetachedInstanceError al serializar la respuesta en FastAPI
            uow.session.expunge(db_user)
            return db_user

    def listar_usuarios(self) -> list[Usuario]:
        with self.uow as uow:
            users = uow.usuarios.get_all()
            for user in users:
                uow.session.expunge(user)
            return users

    def cambiar_estado_usuario(self, user_id: int, disabled: bool, current_admin: Usuario) -> Usuario:
        with self.uow as uow:
            user = uow.usuarios.get_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado",
                )

            # Restricción: el admin no puede desactivarse a sí mismo
            if user.id == current_admin.id and disabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El administrador no puede desactivarse a sí mismo",
                )

            user.disabled = disabled
            uow.session.add(user)
            uow.session.flush()
            uow.session.refresh(user)

            uow.session.expunge(user)
            return user