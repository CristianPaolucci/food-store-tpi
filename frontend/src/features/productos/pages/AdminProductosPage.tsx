import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productosAdminService,
  type ProductoCreate,
  type ProductoStockUpdate,
} from '../api/productosAdminService';
import { productosService } from '../api/productosService';
import { categoriasService } from '../../categorias/api/categoriasService';
import { AdminNav } from '../../admin/pages/AdminResumenPage';
import { Button } from '../../../shared/ui/Button';
import { handleApiError } from '../../../shared/api/handleApiError';
import type { Producto } from '../types/producto.types';

interface AvisoModalState {
  tipo: 'exito' | 'error';
  titulo: string;
  mensaje: string;
}

export const AdminProductosPage = () => {
  const queryClient = useQueryClient();

  const [avisoModal, setAvisoModal] = useState<AvisoModalState | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);

  // Estado para el modal de edición
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editPrecioBase, setEditPrecioBase] = useState('');
  const [editImagenUrl, setEditImagenUrl] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editDisponible, setEditDisponible] = useState(true);
  const [editCategoriaId, setEditCategoriaId] = useState('');

  // Estados para el formulario de Nuevo Producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioBase, setPrecioBase] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [stock, setStock] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [categoriaId, setCategoriaId] = useState('');

  // Draft local de stock por producto para no disparar peticiones en cada tecla
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});

  const { data: productos = [], isLoading, isError } = useQuery<Producto[]>({
    queryKey: ['admin', 'productos'],
    queryFn: () => productosService.getProductos().then((res) => res.items || res),
  });

  useEffect(() => {
    if (productos.length > 0) {
      const nextDrafts: Record<number, string> = {};
      for (const p of productos) {
        nextDrafts[p.id] = String(p.stock);
      }
      setStockDrafts(nextDrafts);
    }
  }, [productos]);

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasService.getCategorias(),
  });

  const resetNuevoForm = () => {
    setNombre('');
    setDescripcion('');
    setPrecioBase('');
    setImagenUrl('');
    setStock('');
    setDisponible(true);
    setCategoriaId('');
  };

  const cerrarModalEdicion = () => {
    setProductoAEditar(null);
  };

  const crearMutation = useMutation({
    mutationFn: (data: ProductoCreate) => productosAdminService.crearProducto(data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      resetNuevoForm();
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Producto creado',
        mensaje: `Se agregó "${variables.nombre}" al catálogo.`,
      });
    },
    onError: (err) =>
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo crear',
        mensaje: handleApiError(err),
      }),
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductoCreate> }) =>
      productosAdminService.actualizarProducto(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      const nombreAct = variables.data.nombre || editNombre || 'el producto';
      cerrarModalEdicion();
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Cambios guardados',
        mensaje: `Se actualizaron los datos de "${nombreAct}".`,
      });
    },
    onError: (err) =>
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo actualizar',
        mensaje: handleApiError(err),
      }),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoStockUpdate }) =>
      productosAdminService.actualizarStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err) =>
      setAvisoModal({
        tipo: 'error',
        titulo: 'Error al actualizar stock',
        mensaje: handleApiError(err),
      }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => productosAdminService.eliminarProducto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      const eliminado = productoAEliminar;
      setProductoAEliminar(null);
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Producto eliminado',
        mensaje: eliminado
          ? `Se eliminó "${eliminado.nombre}".`
          : 'El producto fue eliminado correctamente.',
      });
    },
    onError: (err) => {
      setProductoAEliminar(null);
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo eliminar',
        mensaje: handleApiError(err),
      });
    },
  });

  const handleGuardarStock = (prod: Producto) => {
    const rawVal = stockDrafts[prod.id] ?? String(prod.stock);
    const nuevoStock = parseInt(rawVal, 10);
    if (Number.isNaN(nuevoStock) || nuevoStock < 0) {
      setStockDrafts((prev) => ({ ...prev, [prod.id]: String(prod.stock) }));
      return;
    }
    if (nuevoStock !== prod.stock) {
      stockMutation.mutate({
        id: prod.id,
        data: { stock: nuevoStock, disponible: prod.disponible },
      });
    }
  };

  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ProductoCreate = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio_base: parseFloat(precioBase),
      imagen_url: imagenUrl.trim(),
      stock: parseInt(stock, 10),
      disponible,
      categoria_id: parseInt(categoriaId, 10),
    };

    crearMutation.mutate(payload);
  };

  const handleOpenEditModal = (prod: Producto) => {
    setProductoAEditar(prod);
    setEditNombre(prod.nombre);
    setEditDescripcion(prod.descripcion || '');
    setEditPrecioBase(String(prod.precio_base));
    setEditImagenUrl(prod.imagen_url);
    setEditStock(String(prod.stock));
    setEditDisponible(prod.disponible);
    setEditCategoriaId(String(prod.categoria_id));
  };

  const handleEditarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoAEditar) return;

    const payload: ProductoCreate = {
      nombre: editNombre.trim(),
      descripcion: editDescripcion.trim(),
      precio_base: parseFloat(editPrecioBase),
      imagen_url: editImagenUrl.trim(),
      stock: parseInt(editStock, 10),
      disponible: editDisponible,
      categoria_id: parseInt(editCategoriaId, 10),
    };

    actualizarMutation.mutate({ id: productoAEditar.id, data: payload });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminNav />
        <div className="flex h-64 items-center justify-center font-medium text-gray-600">
          Cargando productos...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminNav />
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium max-w-xl mx-auto mt-8 shadow-xs">
          Error al cargar los productos del sistema.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <AdminNav />

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">ABM de Productos y Stock</h1>
          <p className="text-sm text-gray-600 mt-1">
            Creá, editá o administrá el stock y disponibilidad de los platos del menú.
          </p>
        </div>
        <span className="inline-flex items-center self-start sm:self-auto text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
          Total: {productos.length} productos
        </span>
      </div>

      {/* Formulario Nuevo Producto */}
      <form
        onSubmit={handleCrearSubmit}
        className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900">Nuevo Producto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej. Hamburguesa Completa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Seleccione categoría</option>
              {categorias.map((cat: { id: number; nombre: string }) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base ($)</label>
            <input
              type="number"
              step="0.01"
              value={precioBase}
              onChange={(e) => setPrecioBase(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="10"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de la Imagen</label>
            <input
              type="url"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Detalles del producto..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" type="submit" disabled={crearMutation.isPending}>
            {crearMutation.isPending ? 'Creando...' : 'Crear Producto'}
          </Button>
        </div>
      </form>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3 font-bold">Producto</th>
              <th className="px-6 py-3 font-bold">Precio</th>
              <th className="px-6 py-3 font-bold">Stock</th>
              <th className="px-6 py-3 font-bold">Disponible</th>
              <th className="px-6 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {productos.map((prod) => (
              <tr key={prod.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 flex items-center space-x-3">
                  <img
                    src={prod.imagen_url}
                    alt={prod.nombre}
                    className="w-10 h-10 object-cover rounded-md shrink-0"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{prod.nombre}</div>
                    <div className="text-gray-500 text-xs line-clamp-1">
                      {prod.descripcion || 'Sin descripción'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">
                  ${Number(prod.precio_base).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min={0}
                    value={stockDrafts[prod.id] ?? String(prod.stock)}
                    onChange={(e) =>
                      setStockDrafts((prev) => ({ ...prev, [prod.id]: e.target.value }))
                    }
                    onBlur={() => handleGuardarStock(prod)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm font-semibold text-center"
                  />
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      stockMutation.mutate({
                        id: prod.id,
                        data: { stock: prod.stock, disponible: !prod.disponible },
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      prod.disponible
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {prod.disponible ? 'Disponible' : 'No disponible'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  <Button variant="secondary" onClick={() => handleOpenEditModal(prod)}>
                    Editar
                  </Button>
                  <Button variant="primary" onClick={() => setProductoAEliminar(prod)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PARA EDITAR PRODUCTO */}
      {productoAEditar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  Edición de producto
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                  Editar Producto #{productoAEditar.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={cerrarModalEdicion}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditarSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={editCategoriaId}
                    onChange={(e) => setEditCategoriaId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Seleccione categoría</option>
                    {categorias.map((cat: { id: number; nombre: string }) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Base ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrecioBase}
                    onChange={(e) => setEditPrecioBase(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de la Imagen
                  </label>
                  <input
                    type="url"
                    value={editImagenUrl}
                    onChange={(e) => setEditImagenUrl(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={cerrarModalEdicion}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={actualizarMutation.isPending}>
                  {actualizarMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {productoAEliminar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 p-6 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-4xl shadow-xs">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Confirmar eliminación
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                ¿Eliminar &ldquo;{productoAEliminar.nombre}&rdquo;?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Esta acción dará de baja el producto del catálogo.
              </p>
            </div>
            <div className="pt-1 flex gap-3">
              <button
                type="button"
                onClick={() => setProductoAEliminar(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminarMutation.isPending}
                onClick={() => eliminarMutation.mutate(productoAEliminar.id)}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold shadow-md"
              >
                {eliminarMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AVISO (ÉXITO / ERROR) */}
      {avisoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 p-6 text-center space-y-4">
            <div
              className={`w-16 h-16 mx-auto rounded-full border flex items-center justify-center text-4xl shadow-xs ${
                avisoModal.tipo === 'exito'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {avisoModal.tipo === 'exito' ? '✅' : '⚠️'}
            </div>
            <div className="space-y-1">
              <span
                className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border ${
                  avisoModal.tipo === 'exito'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {avisoModal.titulo}
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 pt-1">{avisoModal.mensaje}</h3>
            </div>
            <button
              type="button"
              onClick={() => setAvisoModal(null)}
              className={`w-full py-2.5 px-4 rounded-xl text-white transition-colors text-sm font-semibold shadow-sm ${
                avisoModal.tipo === 'exito'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};