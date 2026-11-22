import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card } from '../../../shared/ui/Card';

export const LoginForm = () => {
  const setUsuario = useAuthStore((state) => state.setUsuario);
  type UsuarioAuth = NonNullable<Parameters<typeof setUsuario>[0]>;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState<UsuarioAuth | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowErrorModal(false);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password);

      // Petición al login del backend
      const response = await axiosInstance.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // El backend devuelve el usuario directamente en response.data.usuario
      const userData = response.data.usuario as UsuarioAuth | undefined;

      if (userData) {
        // Guardamos el usuario en el store de Zustand de inmediato
        setUsuario(userData);
        setLoggedInUser(userData);
        setShowSuccessModal(true);
      } else {
        throw new Error('No se recibieron los datos del usuario');
      }
    } catch (err: unknown) {
      console.error('Error de login:', err);
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      const mensajeError =
        errorObj.response?.data?.detail ||
        errorObj.message ||
        'Error al iniciar sesión. Verificá tus credenciales.';
      setError(mensajeError);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterLogin = () => {
    const rol = (loggedInUser as { role?: string } | null)?.role;
    setShowSuccessModal(false);

    if (rol === 'admin') {
      navigate('/admin/resumen');
    } else {
      navigate('/');
    }
  };

  const userRecord = loggedInUser as
    | { full_name?: string; nombre?: string; username?: string }
    | null;
  const nombreSaludo =
    userRecord?.full_name || userRecord?.nombre || userRecord?.username || username.trim();

  return (
    <>
      <div className="flex justify-center items-center min-h-[80vh] px-4">
        <Card title="Iniciar Sesión" className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Usuario"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresá tu usuario"
              required
            />

            <Input
              label="Contraseña"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>

      {/* MODAL DE INICIO DE SESIÓN EXITOSO */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center text-3xl">
              🎉
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">
                ¡Sesión iniciada con éxito! 👋
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ¡Qué bueno verte de nuevo, <strong>{nombreSaludo}</strong>! Todo listo para disfrutar de Food Store 🍔✨.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleContinueAfterLogin}
                className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-md shadow-indigo-200"
              >
                🚀 Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CREDENCIALES O INICIO DE SESIÓN INCORRECTO */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">
                No pudimos iniciar sesión 🔑
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {error || 'El usuario o la contraseña son incorrectos. Revisá tus datos e intentá de nuevo.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 text-white py-2.5 px-4 rounded-xl hover:bg-red-700 transition-colors text-sm font-medium shadow-md shadow-red-200"
              >
                🔄 Intentar nuevamente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};