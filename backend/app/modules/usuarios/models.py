from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    email: str
    role: str = Field(default="user")
    disabled: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relación con Pedido utilizando comillas para evitar dependencias circulares directas
    pedidos: List["Pedido"] = Relationship(back_populates="usuario")

# 👇 IMPORTANTE: Importamos Pedido al final del archivo para que SQLAlchemy resuelva el mapeador correctamente al arrancar
from app.modules.pedidos.models import Pedido