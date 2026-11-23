from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from app.modules.categorias.models import Categoria

if TYPE_CHECKING:
    from app.modules.pedidos.models import DetallePedido

class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: Optional[int] = Field(default=None, primary_key=True)
    categoria_id: int = Field(foreign_key="categorias.id", nullable=False)
    nombre: str = Field(nullable=False)
    descripcion: Optional[str] = None
    precio_base: float = Field(default=0.0, ge=0)
    imagen_url: Optional[str] = None
    stock: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True)
    activo: bool = Field(default=True)

    categoria: Optional[Categoria] = Relationship(
        back_populates="productos",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    detalles: List["DetallePedido"] = Relationship(back_populates="producto")