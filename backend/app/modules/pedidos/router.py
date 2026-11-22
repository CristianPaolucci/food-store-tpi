from datetime import datetime
from fastapi import APIRouter, status, Request, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.pedidos.models import Pedido
from app.modules.pedidos.schemas import PedidoCreate
from app.modules.pedidos.service import PedidoService
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


class EstadoUpdateIn(BaseModel):
    estado: str


def get_current_user_from_request(request: Request) -> Usuario:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado (Falta cookie)")

    payload = decode_access_token(token)
    if not payload or not isinstance(payload, dict) or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    username = payload["sub"]
    with session_factory() as db:
        user = db.exec(select(Usuario).where(Usuario.username == username)).first()
        if not user or user.disabled:
            raise HTTPException(status_code=401, detail="Usuario no encontrado o deshabilitado")
        return user


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_pedido(pedido_in: PedidoCreate, request: Request):
    user = get_current_user_from_request(request)
    service = PedidoService(PedidoUnitOfWork(session_factory))
    return service.crear_pedido(usuario_id=user.id, pedido_in=pedido_in)


@router.get("/", status_code=status.HTTP_200_OK)
def listar_pedidos(request: Request):
    user = get_current_user_from_request(request)
    service = PedidoService(PedidoUnitOfWork(session_factory))
    pedidos = service.listar_pedidos_usuario(usuario_id=user.id)
    return {
        "total": len(pedidos),
        "items": pedidos,
    }


@router.get("/resumen", status_code=status.HTTP_200_OK)
def obtener_resumen_pedidos(request: Request):
    user = get_current_user_from_request(request)
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    with session_factory() as db:
        pedidos = db.exec(select(Pedido)).all()

    hoy = datetime.now().date()
    pendientes = sum(1 for p in pedidos if p.estado == "PENDIENTE")
    en_preparacion = sum(1 for p in pedidos if p.estado == "EN_PREPARACION")
    entregados = sum(1 for p in pedidos if p.estado == "ENTREGADO")
    cancelados = sum(1 for p in pedidos if p.estado == "CANCELADO")
    pedidos_hoy = sum(1 for p in pedidos if p.created_at.date() == hoy)
    ingresos_entregados = sum(p.total for p in pedidos if p.estado == "ENTREGADO")

    return {
        "pendientes": pendientes,
        "en_preparacion": en_preparacion,
        "entregados": entregados,
        "cancelados": cancelados,
        "pedidos_hoy": pedidos_hoy,
        "ingresos_entregados": ingresos_entregados,
    }


@router.patch("/{pedido_id}/cancelar", status_code=status.HTTP_200_OK)
def cancelar_pedido(pedido_id: int, request: Request):
    user = get_current_user_from_request(request)
    with session_factory() as db:
        pedido = db.get(Pedido, pedido_id)
        if not pedido:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
        if user.role != "admin" and pedido.usuario_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
        if pedido.estado != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden cancelar pedidos en estado PENDIENTE",
            )

    service = PedidoService(PedidoUnitOfWork(session_factory))
    return service.cambiar_estado_pedido(pedido_id=pedido_id, nuevo_estado="CANCELADO")


admin_pedidos_router = APIRouter(prefix="/admin/pedidos", tags=["Admin - Pedidos"])


@admin_pedidos_router.get("/", status_code=status.HTTP_200_OK)
@admin_pedidos_router.get("", status_code=status.HTTP_200_OK, include_in_schema=False)
def admin_listar_todos_los_pedidos(request: Request):
    user = get_current_user_from_request(request)
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    service = PedidoService(PedidoUnitOfWork(session_factory))
    pedidos = service.listar_todos_pedidos()
    return {
        "total": len(pedidos),
        "items": pedidos,
    }


@admin_pedidos_router.patch("/{pedido_id}/estado", status_code=status.HTTP_200_OK)
def admin_actualizar_estado_pedido(pedido_id: int, body: EstadoUpdateIn, request: Request):
    user = get_current_user_from_request(request)
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    estado_destino = body.estado.upper().strip()
    estados_validos = {"PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"}
    if estado_destino not in estados_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de pedido no válido",
        )

    service = PedidoService(PedidoUnitOfWork(session_factory))
    return service.cambiar_estado_pedido(pedido_id=pedido_id, nuevo_estado=estado_destino)