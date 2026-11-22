from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.productos.models import Producto

class Categoria(SQLModel, table=True):
    __tablename__ = "categorias"  # <-- Debe coincidir exactamente con esto

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, index=True, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None)
    activo: bool = Field(default=True)

    productos: list["Producto"] = Relationship(back_populates="categoria")