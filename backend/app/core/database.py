from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy import text
from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args
)

def create_all_tables() -> None:
    # Importante: importar en orden jerárquico para que las tablas base existan antes de las FK
    from app.modules.usuarios.models import Usuario
    from app.modules.categorias.models import Categoria
    from app.modules.productos.models import Producto
    from app.modules.pedidos.models import Pedido, DetallePedido

    SQLModel.metadata.create_all(engine)

    # ⚠️ Verificación y parche automático para SQLite: añade columnas faltantes (como created_at) sin perder datos
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.begin() as conn:
            try:
                result = conn.execute(text("PRAGMA table_info(pedidos);"))
                columns = [row[1] for row in result.fetchall()]
                
                if columns and "created_at" not in columns:
                    conn.execute(text("ALTER TABLE pedidos ADD COLUMN created_at DATETIME;"))
            except Exception:
                pass

def session_factory() -> Session:
    return Session(engine)