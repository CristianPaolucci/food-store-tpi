from fastapi import HTTPException, status
from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork):
        self.uow = uow

    def crear_categoria(self, categoria_in: CategoriaCreate) -> Categoria:
        with self.uow as uow:
            if uow.categorias.get_by_nombre(categoria_in.nombre):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe una categoría con ese nombre"
                )
            db_categoria = Categoria(
                nombre=categoria_in.nombre,
                descripcion=categoria_in.descripcion,
                activo=True
            )
            uow.categorias.add(db_categoria)
            uow.session.flush()
            uow.session.refresh(db_categoria)

            # Evita el DetachedInstanceError al serializar la respuesta en FastAPI
            uow.session.expunge(db_categoria)
            return db_categoria

    def listar_categorias(self, solo_activos: bool = True) -> list[Categoria]:
        with self.uow as uow:
            categorias = uow.categorias.get_all()
            if solo_activos:
                resultado = [c for c in categorias if c.activo]
            else:
                resultado = categorias

            for cat in resultado:
                uow.session.expunge(cat)
            return resultado

    def obtener_por_id(self, categoria_id: int) -> Categoria:
        with self.uow as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada"
                )

            uow.session.expunge(categoria)
            return categoria

    def actualizar_categoria(self, categoria_id: int, categoria_in: CategoriaUpdate) -> Categoria:
        with self.uow as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada"
                )

            update_data = categoria_in.model_dump(exclude_unset=True)
            if "nombre" in update_data and update_data["nombre"] != categoria.nombre:
                existing = uow.categorias.get_by_nombre(update_data["nombre"])
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Ya existe otra categoría con ese nombre"
                    )

            for key, value in update_data.items():
                setattr(categoria, key, value)

            uow.session.add(categoria)
            uow.session.flush()
            uow.session.refresh(categoria)

            uow.session.expunge(categoria)
            return categoria

    def desactivar_categoria(self, categoria_id: int) -> Categoria:
        with self.uow as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada"
                )
            categoria.activo = False
            uow.session.add(categoria)
            uow.session.flush()
            uow.session.refresh(categoria)

            uow.session.expunge(categoria)
            return categoria