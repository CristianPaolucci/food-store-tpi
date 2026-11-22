from fastapi import HTTPException, status
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.productos.models import Producto
from app.modules.productos.schemas import ProductoCreate, ProductoUpdate
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoService:
    def __init__(self, producto_uow: ProductoUnitOfWork, categoria_uow: CategoriaUnitOfWork):
        self.producto_uow = producto_uow
        self.categoria_uow = categoria_uow

    def crear_producto(self, producto_in: ProductoCreate) -> Producto:
        with self.categoria_uow as cat_uow:
            categoria = cat_uow.categorias.get_by_id(producto_in.categoria_id)
            if not categoria or not categoria.activo:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La categoría especificada no existe o está inactiva",
                )

        with self.producto_uow as prod_uow:
            if prod_uow.productos.get_by_nombre(producto_in.nombre):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un producto con ese nombre",
                )

            data = producto_in.model_dump()
            if "precio" in data and "precio_base" not in data:
                data["precio_base"] = data.pop("precio")

            db_producto = Producto(
                **data,
                activo=True,
            )
            prod_uow.productos.add(db_producto)
            prod_uow.session.commit()
            prod_uow.session.refresh(db_producto)
            prod_uow.session.expunge(db_producto)
            return db_producto

    def listar_productos(self, solo_activos: bool = True) -> list[Producto]:
        with self.producto_uow as prod_uow:
            productos = prod_uow.productos.get_all()
            resultado = [p for p in productos if p.activo] if solo_activos else productos
            for p in resultado:
                prod_uow.session.expunge(p)
            return resultado

    def obtener_por_id(self, producto_id: int) -> Producto:
        with self.producto_uow as prod_uow:
            producto = prod_uow.productos.get_by_id(producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado",
                )
            prod_uow.session.expunge(producto)
            return producto

    def actualizar_producto(self, producto_id: int, producto_in: ProductoUpdate) -> Producto:
        with self.producto_uow as prod_uow:
            producto = prod_uow.productos.get_by_id(producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado",
                )

            update_data = producto_in.model_dump(exclude_unset=True)

            if "categoria_id" in update_data:
                with self.categoria_uow as cat_uow:
                    categoria = cat_uow.categorias.get_by_id(update_data["categoria_id"])
                    if not categoria or not categoria.activo:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="La nueva categoría no existe o está inactiva",
                        )

            if "nombre" in update_data and update_data["nombre"] != producto.nombre:
                existing = prod_uow.productos.get_by_nombre(update_data["nombre"])
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Ya existe otro producto con ese nombre",
                    )

            for key, value in update_data.items():
                setattr(producto, key, value)

            prod_uow.session.add(producto)
            prod_uow.session.commit()
            prod_uow.session.refresh(producto)
            prod_uow.session.expunge(producto)
            return producto

    def desactivar_producto(self, producto_id: int) -> Producto:
        with self.producto_uow as prod_uow:
            producto = prod_uow.productos.get_by_id(producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado",
                )
            producto.activo = False
            prod_uow.session.add(producto)
            prod_uow.session.commit()
            prod_uow.session.refresh(producto)
            prod_uow.session.expunge(producto)
            return producto