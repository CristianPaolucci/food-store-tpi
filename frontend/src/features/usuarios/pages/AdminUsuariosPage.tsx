import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosService, type UserPublic } from '../api/usuariosService';
import { AdminNav } from '../../admin/pages/AdminResumenPage';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../shared/ui/Button';
import { handleApiError } from '../../../shared/api/handleApiError';

interface AvisoModalState {
  tipo: 'exito' | 'error';
  titulo: string;
  mensaje: string;
}

const obtenerNombreCompleto = (usr: UserPublic): string => {
  const nombre = usr.full_name?.trim();
  if (nombre) return nombre;
  return usr.username;
};

export const AdminUsuariosPage = () => {
  const queryClient = useQueryClient();
  const usuarioActual = useAuthStore((state) => state.usuario);
  const [avisoModal, setAvisoModal] = useState<AvisoModalState | null>(null);

  const { data: usuarios = [], isLoading, isError } = useQuery<UserPublic[]>({
    queryKey: ['admin', 'usuarios'],
    queryFn: () => usuariosService.getUsuarios(),
  });

  const activarMutation = useMutation({
    mutationFn: (id: number) => usuariosService.activarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Usuario activado',
        mensaje: 'El usuario ya puede operar nuevamente.',
      });
    },
    onError: (err) =>
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo activar',
        mensaje: handleApiError(err),
      }),
  });

  const desactivarMutation = useMutation({
    mutationFn: (id: number) => usuariosService.desactivarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Usuario desactivado',
        mensaje: 'El acceso del usuario fue desactivado.',
      });
    },
    onError: (err) =>
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo desactivar',
        mensaje: handleApiError(err),
      }),
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="flex h-64 items-center justify-center font-medium text-gray-600">
          Cargando usuarios del sistema...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium max-w-xl mx-auto mt-8 shadow-xs">
          Error al cargar los usuarios. Verifica que dispongas de los permisos de administrador necesarios.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <AdminNav />

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600 mt-1">
            Administrá el estado de las cuentas registradas en la plataforma.
          </p>
        </div>
        <span className="inline-flex items-center self-start sm:self-auto text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
          Total: {usuarios.length} usuarios
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3 font-bold">Usuario / Email</th>
              <th className="px-6 py-3 font-bold">Nombre Completo</th>
              <th className="px-6 py-3 font-bold">Rol</th>
              <th className="px-6 py-3 font-bold">Estado</th>
              <th className="px-6 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {usuarios.map((usr) => {
              const esElUsuarioLogueado = usuarioActual?.email === usr.email;

              return (
                <tr key={usr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{usr.username}</div>
                    <div className="text-gray-500 text-xs">{usr.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {obtenerNombreCompleto(usr)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        usr.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {usr.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        !usr.disabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {!usr.disabled ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {usr.disabled ? (
                      <Button
                        variant="primary"
                        onClick={() => activarMutation.mutate(usr.id)}
                        disabled={activarMutation.isPending}
                      >
                        Activar
                      </Button>
                    ) : (
                      !esElUsuarioLogueado && (
                        <Button
                          variant="secondary"
                          onClick={() => desactivarMutation.mutate(usr.id)}
                          disabled={desactivarMutation.isPending}
                        >
                          Desactivar
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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