import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoriasService,
  type CategoriaRead,
  type CategoriaCreate,
} from '../api/categoriasService';
import { AdminNav } from '../../admin/pages/AdminResumenPage';
import { Button } from '../../../shared/ui/Button';
import { handleApiError } from '../../../shared/api/handleApiError';

interface AvisoModalState {
  tipo: 'exito' | 'error';
  titulo: string;
  mensaje: string;
}

export const AdminCategoriasPage = () => {
  const queryClient = useQueryClient();
  const [avisoModal, setAvisoModal] = useState<AvisoModalState | null>(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<CategoriaRead | null>(null);

  // Estado para el modal de edición
  const [categoriaAEditar, setCategoriaAEditar] = useState<CategoriaRead | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  // Estado para el formulario de nueva categoría
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const { data: categorias = [], isLoading, isError } = useQuery<CategoriaRead[]>({
    queryKey: ['admin', 'categorias'],
    queryFn: () => categoriasService.getCategorias(),
  });

  const resetNuevoForm = () => {
    setNombre('');
    setDescripcion('');
  };

  const cerrarModalEdicion = () => {
    setCategoriaAEditar(null);
  };

  const crearMutation = useMutation({
    mutationFn: (nuevaCat: CategoriaCreate) => categoriasService.crearCategoria(nuevaCat),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      resetNuevoForm();
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Categoría creada',
        mensaje: `Se creó la categoría "${variables.nombre}".`,
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
    mutationFn: ({ id, data }: { id: number; data: CategoriaCreate }) =>
      categoriasService.actualizarCategoria(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      cerrarModalEdicion();
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Cambios guardados',
        mensaje: `Se actualizó la categoría "${variables.data.nombre}".`,
      });
    },
    onError: (err) =>
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo actualizar',
        mensaje: handleApiError(err),
      }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => categoriasService.eliminarCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      const eliminada = categoriaAEliminar;
      setCategoriaAEliminar(null);
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Categoría eliminada',
        mensaje: eliminada
          ? `Se eliminó "${eliminada.nombre}".`
          : 'La categoría fue eliminada.',
      });
    },
    onError: (err) => {
      setCategoriaAEliminar(null);
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo eliminar',
        mensaje: handleApiError(err),
      });
    },
  });

  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const descLimpia = descripcion.trim();
    if (!nombreLimpio) return;

    crearMutation.mutate({ nombre: nombreLimpio, descripcion: descLimpia });
  };

  const handleOpenEditModal = (cat: CategoriaRead) => {
    setCategoriaAEditar(cat);
    setEditNombre(cat.nombre);
    setEditDescripcion(cat.descripcion || '');
  };

  const handleEditarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaAEditar) return;

    const nombreLimpio = editNombre.trim();
    const descLimpia = editDescripcion.trim();
    if (!nombreLimpio) return;

    actualizarMutation.mutate({
      id: categoriaAEditar.id,
      data: { nombre: nombreLimpio, descripcion: descLimpia },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="flex h-64 items-center justify-center font-medium text-gray-600">
          Cargando categorías...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium max-w-xl mx-auto mt-8 shadow-xs">
          Error al cargar las categorías del sistema.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <AdminNav />

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">ABM de Categorías</h1>
          <p className="text-sm text-gray-600 mt-1">
            Organizá las categorías del menú para clasificar los productos.
          </p>
        </div>
        <span className="inline-flex items-center self-start sm:self-auto text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
          Total: {categorias.length} categorías
        </span>
      </div>

      {/* Formulario Nueva Categoría */}
      <form
        onSubmit={handleCrearSubmit}
        className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900">Nueva Categoría</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ej. Hamburguesas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ej. Categoría de comidas rápidas"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="primary" type="submit" disabled={crearMutation.isPending}>
            {crearMutation.isPending ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </div>
      </form>

      {/* Tabla de Categorías */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3 font-bold">ID</th>
              <th className="px-6 py-3 font-bold">Nombre</th>
              <th className="px-6 py-3 font-bold">Descripción</th>
              <th className="px-6 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {categorias.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{cat.id}</td>
                <td className="px-6 py-4 text-gray-800 font-medium">{cat.nombre}</td>
                <td className="px-6 py-4 text-gray-500">{cat.descripcion || '-'}</td>
                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                  <Button variant="secondary" onClick={() => handleOpenEditModal(cat)}>
                    Editar
                  </Button>
                  <Button variant="primary" onClick={() => setCategoriaAEliminar(cat)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PARA EDITAR CATEGORÍA */}
      {categoriaAEditar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  Edición de categoría
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                  Editar Categoría #{categoriaAEditar.id}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
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

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {categoriaAEliminar && (
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
                ¿Eliminar &ldquo;{categoriaAEliminar.nombre}&rdquo;?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Esta acción dará de baja la categoría del sistema.
              </p>
            </div>
            <div className="pt-1 flex gap-3">
              <button
                type="button"
                onClick={() => setCategoriaAEliminar(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminarMutation.isPending}
                onClick={() => eliminarMutation.mutate(categoriaAEliminar.id)}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold shadow-md"
              >
                {eliminarMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AVISO */}
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