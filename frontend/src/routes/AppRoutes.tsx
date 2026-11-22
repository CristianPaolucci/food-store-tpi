import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoginForm } from '../features/auth/components/LoginForm';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { MainLayout } from '../shared/layout/MainLayout';
import { CatalogoPage } from '../features/productos/pages/CatalogoPage';
import { CarritoPage } from '../features/pedidos/pages/CarritoPage';
import { CheckoutPage } from '../features/pedidos/pages/CheckoutPage';
import { MisPedidosPage } from '../features/pedidos/pages/MisPedidosPage';
import { AdminPedidosPage } from '../features/admin/pages/AdminPedidosPage';
import { AdminUsuariosPage } from '../features/usuarios/pages/AdminUsuariosPage';
import { AdminResumenPage } from '../features/admin/pages/AdminResumenPage';
import { AdminCategoriasPage } from '../features/categorias/pages/AdminCategoriasPage';
import { AdminProductosPage } from '../features/productos/pages/AdminProductosPage';
import { Button } from '../shared/ui/Button';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 bg-white border border-gray-200 rounded-lg shadow-sm text-center space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Acceso no autorizado</h1>
      <p className="text-gray-600">
        No tenés permisos de administrador para acceder a esta sección.
      </p>
      <Button variant="primary" onClick={() => navigate('/')}>
        Volver al Catálogo
      </Button>
    </div>
  );
};

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const usuario = useAuthStore((state) => state.usuario);
  const cargando = useAuthStore((state) => state.cargando);

  if (cargando) {
    return <div className="flex h-screen items-center justify-center font-medium text-gray-600">Cargando sesión...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && usuario.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas contenidas en el MainLayout principal */}
      <Route element={<MainLayout />}>
        {/* Catálogo público de productos en la ruta principal */}
        <Route path="/" element={<CatalogoPage />} />

        {/* Rutas de autenticación */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Ruta pública del carrito de compras */}
        <Route path="/carrito" element={<CarritoPage />} />

        {/* Acceso no autorizado */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Ruta protegida para el proceso de Checkout */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida para el historial de pedidos del cliente */}
        <Route
          path="/mis-pedidos"
          element={
            <ProtectedRoute>
              <MisPedidosPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida para el Resumen del Negocio (Admin) */}
        <Route
          path="/admin/resumen"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminResumenPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida para el ABM de Categorías (Admin) */}
        <Route
          path="/admin/categorias"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminCategoriasPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida para el ABM de Productos y Stock (Admin) */}
        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminProductosPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida para el Panel de Administración de Pedidos */}
        <Route
          path="/admin/pedidos"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPedidosPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida para la Gestión de Usuarios (Admin) */}
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminUsuariosPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirección por defecto para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};