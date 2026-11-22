import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProductos } from '../hooks/useProductos';
import { ProductoCard } from '../components/ProductoCard';
import { Button } from '../../../shared/ui/Button';
import type { Producto } from '../types/producto.types';

export const CatalogoPage = () => {
  const queryClient = useQueryClient();
  const [categoria, setCategoria] = useState('todos');
  const [page, setPage] = useState(1);
  const limit = 16;
  const skip = (page - 1) * limit;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['productos'] });
  }, [queryClient]);

  const { data, isLoading, isError } = useProductos({
    skip: 0,
    limit: 100,
  });

  const productosCrudos: Producto[] = data?.items || [];

  const productosFiltrados = productosCrudos.filter((producto) => {
    if (categoria === 'todos') return true;

    const prodExt = producto as Producto & { titulo?: string };
    const nombre = (prodExt.nombre || prodExt.titulo || '').toLowerCase();

    const esBebida =
      nombre.includes('coca') ||
      nombre.includes('cerveza') ||
      nombre.includes('agua') ||
      nombre.includes('limonada') ||
      nombre.includes('jugo') ||
      nombre.includes('vino') ||
      nombre.includes('gaseosa');

    const esPostre =
      nombre.includes('cheesecake') ||
      nombre.includes('volcán') ||
      nombre.includes('tiramisú') ||
      nombre.includes('brownie') ||
      nombre.includes('chocolate') ||
      nombre.includes('postre') ||
      nombre.includes('helado') ||
      nombre.includes('flan');

    if (categoria === 'bebidas') return esBebida;
    if (categoria === 'postres') return esPostre;
    if (categoria === 'comidas') return !esBebida && !esPostre;

    return true;
  });

  const totalPages = Math.ceil(productosFiltrados.length / limit) || 1;
  const productos = productosFiltrados.slice(skip, skip + limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Comidas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Explora nuestros platos y arma tu pedido.
          </p>
        </div>

        {/* Botones de filtro rápido por categoría */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setCategoria('todos');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoria === 'todos'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍽️ Todos
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoria('comidas');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoria === 'comidas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍔 Comidas
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoria('bebidas');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoria === 'bebidas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍺 Bebidas
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoria('postres');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoria === 'postres'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍰 Postres
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap justify-center gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white h-80 w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] rounded-lg border border-gray-200 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="bg-gray-200 h-40 rounded w-full mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center font-medium">
          Ocurrió un error al cargar el catálogo de productos. Intenta nuevamente más tarde.
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 rounded-lg text-center space-y-3">
          <p className="text-lg font-semibold text-gray-700">
            No se encontraron productos en esta categoría
          </p>
          <p className="text-sm text-gray-500">Prueba seleccionando otra categoría.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-6">
            {productos.map((producto) => {
              const prodExt = producto as Producto & { producto_id?: number };
              return (
                <div
                  key={producto.id || prodExt.producto_id}
                  className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] max-w-sm"
                >
                  <ProductoCard producto={producto as never} />
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Anterior
              </Button>
              <span className="text-sm font-medium text-gray-700">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};