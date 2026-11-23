from pydantic import BaseModel, Field
from app.modules.categorias.schemas import CategoriaRead

class ProductoCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150)
    descripcion: str | None = None
    precio_base: float = Field(..., ge=0)
    imagen_url: str | None = None
    stock: int = Field(default=0, ge=0)
    disponible: bool = True
    categoria_id: int

class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    descripcion: str | None = None
    precio_base: float | None = Field(default=None, ge=0)
    imagen_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None
    categoria_id: int | None = None
    activo: bool | None = None

class ProductoStockUpdate(BaseModel):
    stock: int = Field(..., ge=0)
    disponible: bool

class ProductoRead(BaseModel):
    id: int
    nombre: str
    descripcion: str | None = None
    precio_base: float
    imagen_url: str | None = None
    stock: int
    disponible: bool
    activo: bool
    categoria_id: int
    categoria: CategoriaRead | None = None

    class Config:
        from_attributes = True