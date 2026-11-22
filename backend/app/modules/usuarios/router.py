from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.database import session_factory
from app.core.deps import RoleChecker, get_current_active_user
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios"])

def get_usuario_service(session: Session = Depends(session_factory)) -> UsuarioService:
    uow = UsuarioUnitOfWork(lambda: session)
    return UsuarioService(uow)

@router.get("/", response_model=list[UserPublic], dependencies=[Depends(RoleChecker(["admin"]))])
def listar_usuarios(service: UsuarioService = Depends(get_usuario_service)):
    return service.listar_usuarios()

@router.post("/{user_id}/activar", response_model=UserPublic)
def activar_usuario(
    user_id: int,
    current_admin: Usuario = Depends(RoleChecker(["admin"])),
    service: UsuarioService = Depends(get_usuario_service)
):
    return service.cambiar_estado_usuario(user_id, disabled=False, current_admin=current_admin)

@router.post("/{user_id}/desactivar", response_model=UserPublic)
def desactivar_usuario(
    user_id: int,
    current_admin: Usuario = Depends(RoleChecker(["admin"])),
    service: UsuarioService = Depends(get_usuario_service)
):
    return service.cambiar_estado_usuario(user_id, disabled=True, current_admin=current_admin)