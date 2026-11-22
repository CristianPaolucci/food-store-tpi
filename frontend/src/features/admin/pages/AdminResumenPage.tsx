import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService, type ResumenPedidos } from '../api/adminService';

const ADMIN_LINKS = [
  { to: '/admin/resumen', label: '📊 Resumen' },
  { to: '/admin/productos', label: '🍔 Productos' },
  { to: '/admin/categorias', label: '🏷️ Categorías' },
  { to: '/admin/pedidos', label: '📦 Pedidos' },
  { to: '/admin/usuarios', label: '👥 Usuarios' },
];

export const AdminNav = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-xs flex flex-wrap gap-1.5">
    {ADMIN_LINKS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isActive
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-700 hover:bg-gray-100'
          }`
        }
      >
        {item.label}
      </NavLink>
    ))}
  </div>
);

export const AdminResumenPage = () => {
  const { data: resumen, isLoading, isError } = useQuery<ResumenPedidos>({
    queryKey: ['admin', 'resumen'],
    queryFn: () => adminService.getResumen(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="flex h-64 items-center justify-center font-medium text-gray-600">
          Cargando resumen del negocio...
        </div>
      </div>
    );
  }

  if (isError || !resumen) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium max-w-xl mx-auto mt-8 shadow-xs">
          Error al cargar el resumen del negocio. Asegúrate de contar con permisos de administrador.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <AdminNav />

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <h1 className="text-2xl font-extrabold text-gray-900">Resumen del Negocio</h1>
        <p className="text-sm text-gray-600 mt-1">
          Métricas principales de pedidos e ingresos del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pendientes</div>
          <div className="mt-2 text-3xl font-extrabold text-yellow-600">{resumen.pendientes}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">En Preparación</div>
          <div className="mt-2 text-3xl font-extrabold text-blue-600">{resumen.en_preparacion}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Entregados</div>
          <div className="mt-2 text-3xl font-extrabold text-green-600">{resumen.entregados}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cancelados</div>
          <div className="mt-2 text-3xl font-extrabold text-red-600">{resumen.cancelados}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pedidos Hoy</div>
          <div className="mt-2 text-3xl font-extrabold text-purple-600">{resumen.pedidos_hoy}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Ingresos Totales (Entregados)
          </div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">
            ${resumen.ingresos_entregados.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};