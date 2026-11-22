from typing import List
from sqlmodel import Session, select
from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido, DetallePedido

class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(Pedido, session)

    def get_by_usuario(self, usuario_id: int) -> List[Pedido]:
        statement = select(Pedido).where(Pedido.usuario_id == usuario_id)
        return list(self.session.exec(statement).all())

class DetallePedidoRepository(BaseRepository[DetallePedido]):
    def __init__(self, session: Session):
        super().__init__(DetallePedido, session)