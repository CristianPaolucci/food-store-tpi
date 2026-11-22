import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const { usuario, logout } = useAuthStore() as any;
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

  const isAdmin = usuario?.role === 'admin';

  // Función de cierre de sesión conforme a la cátedra
  const handleLogout = async () => {
    try {
      // Petición al backend para borrar la cookie HttpOnly
      await fetch('http://localhost:8000/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error al comunicarse con el servidor en el logout:', error);
    } finally {
      // 🧹 Limpieza exigida del estado del cliente
      useCartStore.getState().vaciar();
      if (logout) logout();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Marca */}
        <Link to={isAdmin ? '/admin/resumen' : '/'} className="text-xl font-bold text-orange-600">
          Food Store
        </Link>

        {/* Enlaces de navegación */}
        <div className="flex items-center space-x-6">
          {isAdmin ? (
            <>
              <Link
                to="/admin/resumen"
                className="text-sm font-semibold text-purple-600 hover:text-purple-800"
              >
                Panel Admin
              </Link>
              <Link
                to="/"
                className="text-sm font-medium text-gray-700 hover:text-orange-600"
              >
                Catálogo
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-sm font-medium text-gray-700 hover:text-orange-600"
              >
                Catálogo
              </Link>

              <Link
                to="/carrito"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 relative"
              >
                Carrito
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-3 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </>
          )}

          {usuario ? (
            <>
              {!isAdmin && (
                <Link
                  to="/mis-pedidos"
                  className="text-sm font-medium text-gray-700 hover:text-orange-600"
                >
                  Mis Pedidos
                </Link>
              )}

              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <span className="text-sm font-semibold bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full">
                  {isAdmin
                    ? '👑 Administrador'
                    : `👤 ${usuario.full_name || usuario.email}`}
                </span>

                <Button variant="secondary" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <Link to="/login">
                <Button variant="secondary">Iniciar Sesión</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Registrarse</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};