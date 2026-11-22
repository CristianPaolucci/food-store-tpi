from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.core.database import session_factory
from app.core.deps import RoleChecker
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaService
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["Categorías"])

def get_categoria_service(session: Session = Depends(session_factory)) -> CategoriaService:
    uow = CategoriaUnitOfWork(lambda: session)
    return CategoriaService(uow)

@router.get("/", response_model=list[CategoriaRead])
def listar_categorias(service: CategoriaService = Depends(get_categoria_service)):
    return service.listar_categorias(solo_activos=True)

@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(categoria_id: int, service: CategoriaService = Depends(get_categoria_service)):
    return service.obtener_por_id(categoria_id)

@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(["admin"]))])
def crear_categoria(categoria_in: CategoriaCreate, service: CategoriaService = Depends(get_categoria_service)):
    return service.crear_categoria(categoria_in)

@router.put("/{categoria_id}", response_model=CategoriaRead, dependencies=[Depends(RoleChecker(["admin"]))])
def actualizar_categoria(categoria_id: int, categoria_in: CategoriaUpdate, service: CategoriaService = Depends(get_categoria_service)):
    return service.actualizar_categoria(categoria_id, categoria_in)

@router.delete("/{categoria_id}", response_model=CategoriaRead, dependencies=[Depends(RoleChecker(["admin"]))])
def desactivar_categoria(categoria_id: int, service: CategoriaService = Depends(get_categoria_service)):
    return service.desactivar_categoria(categoria_id)