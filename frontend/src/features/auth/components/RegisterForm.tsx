import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card } from '../../../shared/ui/Card';

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        password: formData.password,
      });

      // Mostramos el modal de usuario registrado con éxito
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        errorObj.response?.data?.detail ||
          errorObj.message ||
          'Error al registrar el usuario. Intentalo nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-[80vh] px-4 my-8">
        <Card title="Crear Cuenta" className="w-full max-w-md">
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
              value={formData.username}
              onChange={handleChange}
              placeholder="Ej: juanperez"
              required
            />

            <Input
              label="Nombre Completo"
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              required
            />

            <Input
              label="Correo Electrónico"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@ejemplo.com"
              required
            />

            <Input
              label="Contraseña"
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirmar Contraseña"
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>
        </Card>
      </div>

      {/* MODAL DE REGISTRO EXITOSO */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center text-3xl">
              🎉
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">
                ¡Usuario registrado con éxito! ✨
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tu cuenta fue creada correctamente. Ya podés iniciar sesión para empezar a pedir 🍔🍕.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/login');
                }}
                className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-md shadow-indigo-200"
              >
                🚀 Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};