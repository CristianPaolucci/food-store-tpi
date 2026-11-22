from fastapi import HTTPException, status
from sqlmodel import select
from sqlalchemy.orm import selectinload
from app.modules.pedidos.models import Pedido, DetallePedido
from app.modules.pedidos.schemas import PedidoCreate, PedidoRead
from app.modules.productos.models import Producto
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork):
        self.uow = uow

    def _query_pedido_completo(self):
        return (
            select(Pedido)
            .options(
                selectinload(Pedido.usuario),
                selectinload(Pedido.items)
                .selectinload(DetallePedido.producto)
                .selectinload(Producto.categoria),
            )
        )

    def crear_pedido(self, usuario_id: int, pedido_in: PedidoCreate) -> PedidoRead:
        with self.uow as uow:
            total_pedido = 0.0
            detalles_a_crear = []

            for item in pedido_in.detalles:
                producto = uow.session.get(Producto, item.producto_id)
                if not producto or not producto.activo:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"El producto con ID {item.producto_id} no existe o no está disponible",
                    )

                if not producto.disponible or producto.stock < item.cantidad:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Stock insuficiente para el producto: {producto.nombre}. Stock actual: {producto.stock}",
                    )

                precio_unitario = producto.precio_base
                subtotal = precio_unitario * item.cantidad
                total_pedido += subtotal

                producto.stock -= item.cantidad
                uow.session.add(producto)

                detalle = DetallePedido(
                    producto_id=producto.id,
                    cantidad=item.cantidad,
                    nombre_producto=producto.nombre,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal,
                )
                detalles_a_crear.append(detalle)

            nuevo_pedido = Pedido(
                usuario_id=usuario_id,
                estado="PENDIENTE",
                forma_pago=pedido_in.forma_pago,
                direccion_entrega=pedido_in.direccion_entrega,
                notas=pedido_in.notas,
                total=total_pedido,
                items=detalles_a_crear,
            )

            uow.session.add(nuevo_pedido)
            uow.session.flush()

            statement = self._query_pedido_completo().where(Pedido.id == nuevo_pedido.id)
            pedido_creado = uow.session.exec(statement).first()
            return PedidoRead.model_validate(pedido_creado)

    def listar_pedidos_usuario(self, usuario_id: int) -> list[PedidoRead]:
        with self.uow as uow:
            statement = self._query_pedido_completo().where(Pedido.usuario_id == usuario_id)
            pedidos = uow.session.exec(statement).all()
            return [PedidoRead.model_validate(p) for p in pedidos]

    def listar_todos_pedidos(self) -> list[PedidoRead]:
        with self.uow as uow:
            statement = self._query_pedido_completo()
            pedidos = uow.session.exec(statement).all()
            return [PedidoRead.model_validate(p) for p in pedidos]

    def cambiar_estado_pedido(self, pedido_id: int, nuevo_estado: str) -> PedidoRead:
        with self.uow as uow:
            pedido = uow.session.get(Pedido, pedido_id)
            if not pedido:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pedido no encontrado",
                )

            estado_destino = nuevo_estado.upper()

            if estado_destino == "CANCELADO" and pedido.estado != "CANCELADO":
                for detalle in pedido.items:
                    if detalle.producto_id:
                        producto = uow.session.get(Producto, detalle.producto_id)
                        if producto:
                            producto.stock += detalle.cantidad
                            uow.session.add(producto)

            pedido.estado = estado_destino
            uow.session.add(pedido)
            uow.session.flush()

            statement = self._query_pedido_completo().where(Pedido.id == pedido_id)
            pedido_actualizado = uow.session.exec(statement).first()
            return PedidoRead.model_validate(pedido_actualizado)