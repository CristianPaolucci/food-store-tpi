from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Any
from sqlmodel import select
from sqlalchemy.orm import selectinload
from fastapi.encoders import jsonable_encoder

from app.core.database import session_factory
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate, 
    ProductoUpdate, 
    ProductoStockUpdate, 
    ProductoRead
)
from app.core.deps import RoleChecker
from app.modules.usuarios.models import Usuario
from app.modules.categorias.models import Categoria

router = APIRouter(prefix="/productos", tags=["Productos"], redirect_slashes=False)

# Instancia del verificador de rol para administrador
admin_required = RoleChecker(["admin"])

@router.get("", response_model=List[Any])
@router.get("/", response_model=List[Any])
def listar_productos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    categoria_id: Optional[int] = None,
    disponible: Optional[bool] = None
):
    """
    Listado público de productos activos, con soporte opcional de paginación, búsqueda y filtros.
    """
    try:
        with session_factory() as session:
            statement = select(Producto).options(selectinload(Producto.categoria))
            
            # Filtro por baja lógica (solo activos para el público)
            statement = statement.where(Producto.activo == True)
            
            if search:
                statement = statement.where(Producto.nombre.ilike(f"%{search}%"))
            if categoria_id is not None:
                statement = statement.where(Producto.categoria_id == categoria_id)
            if disponible is not None:
                statement = statement.where(Producto.disponible == disponible)
                
            statement = statement.offset(skip).limit(limit)
            productos = session.exec(statement).all()
            
            return jsonable_encoder(productos)
    except Exception as e:
        print("--- ERROR AL LISTAR PRODUCTOS ---", e)
        try:
            with session_factory() as session:
                statement = select(Producto).where(Producto.activo == True)
                productos = session.exec(statement).all()
                return jsonable_encoder(productos)
        except Exception as err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al listar productos: {str(err)}"
            )

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=Any)
def crear_producto(
    producto_in: ProductoCreate,
    admin_user: Usuario = Depends(admin_required)
):
    """
    Crea un nuevo producto en el catálogo. Exclusivo para administradores.
    Valida que la categoría exista y esté dada de alta.
    """
    try:
        with session_factory() as session:
            # Validamos que la categoría exista y esté activa
            categoria = session.get(Categoria, producto_in.categoria_id)
            if not categoria or not categoria.activo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La categoría no existe o está dada de baja"
                )
            
            nuevo_producto = Producto(**producto_in.model_dump())
            session.add(nuevo_producto)
            session.commit()
            session.refresh(nuevo_producto)
            
            # Recargamos con su relación de categoría para que devuelva el schema completo
            statement = select(Producto).options(selectinload(Producto.categoria)).where(Producto.id == nuevo_producto.id)
            producto_creado = session.exec(statement).first()
            
            return jsonable_encoder(producto_creado)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear el producto: {str(e)}"
        )

@router.put("/{id}", response_model=Any)
def actualizar_producto(
    id: int,
    producto_in: ProductoUpdate,
    admin_user: Usuario = Depends(admin_required)
):
    """
    Actualiza los datos de un producto existente. Exclusivo para administradores.
    Permite actualización parcial (conserva los campos que no se envíen).
    """
    try:
        with session_factory() as session:
            producto = session.get(Producto, id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado"
                )
            
            update_data = producto_in.model_dump(exclude_unset=True)
            
            if "categoria_id" in update_data:
                categoria = session.get(Categoria, update_data["categoria_id"])
                if not categoria or not categoria.activo:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="La nueva categoría no existe o está dada de baja"
                    )
            
            for key, value in update_data.items():
                setattr(producto, key, value)
            
            session.add(producto)
            session.commit()
            session.refresh(producto)
            
            statement = select(Producto).options(selectinload(Producto.categoria)).where(Producto.id == id)
            producto_actualizado = session.exec(statement).first()
            
            return jsonable_encoder(producto_actualizado)
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al actualizar el producto: {str(e)}"
        )

@router.patch("/{id}/stock", response_model=Any)
def actualizar_stock_disponibilidad(
    id: int,
    stock_in: ProductoStockUpdate,
    admin_user: Usuario = Depends(admin_required)
):
    """
    Actualiza exclusivamente el stock y la disponibilidad de un producto. Exclusivo para administradores[cite: 14].
    """
    try:
        with session_factory() as session:
            producto = session.get(Producto, id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado"
                )
            
            producto.stock = stock_in.stock
            producto.disponible = stock_in.disponible
            
            session.add(producto)
            session.commit()
            session.refresh(producto)
            
            statement = select(Producto).options(selectinload(Producto.categoria)).where(Producto.id == id)
            producto_actualizado = session.exec(statement).first()
            
            return jsonable_encoder(producto_actualizado)
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al actualizar el stock del producto: {str(e)}"
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    id: int,
    admin_user: Usuario = Depends(admin_required)
):
    """
    Realiza la baja lógica de un producto (activo = false). Exclusivo para administradores.
    Responde con código 204 sin cuerpo[cite: 13, 22].
    """
    try:
        with session_factory() as session:
            producto = session.get(Producto, id)
            if not producto or not producto.activo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado"
                )
            
            producto.activo = False
            session.add(producto)
            session.commit()
            
            return None
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al dar de baja el producto: {str(e)}"
        )