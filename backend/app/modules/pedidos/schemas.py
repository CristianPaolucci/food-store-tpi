from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.modules.productos.schemas import ProductoRead


class UsuarioResumenRead(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class DetallePedidoCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(..., gt=0)


class PedidoCreate(BaseModel):
    forma_pago: str = Field(..., min_length=2, max_length=50)
    direccion_entrega: str = Field(..., min_length=5, max_length=200)
    notas: str | None = None
    detalles: list[DetallePedidoCreate] | None = None
    items: list[DetallePedidoCreate] | None = None

    @model_validator(mode="after")
    def asegurar_items_o_detalles(self) -> "PedidoCreate":
        fuente = self.detalles if self.detalles is not None else self.items
        if not fuente or len(fuente) < 1:
            raise ValueError("Debe enviar al menos un ítem en 'items' o 'detalles'")
        self.detalles = fuente
        self.items = fuente
        return self


class DetallePedidoRead(BaseModel):
    id: int
    producto_id: int
    nombre_producto: str
    cantidad: int
    precio_unitario: float
    subtotal: float
    producto: ProductoRead | None = None

    class Config:
        from_attributes = True


class PedidoRead(BaseModel):
    id: int
    usuario_id: int
    usuario: UsuarioResumenRead | None = None
    total: float
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    items: list[DetallePedidoRead] = []

    class Config:
        from_attributes = True