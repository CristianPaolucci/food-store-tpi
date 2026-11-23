import { axiosInstance } from '../../../shared/api/axiosInstance';

export interface UserPublic {
  id: number;
  username: string;
  full_name?: string | null;
  email: string;
  role: 'user' | 'admin';
  disabled: boolean;
  created_at?: string | null;
}

export const usuariosService = {
  // Listar todos los usuarios (solo admin)
  getUsuarios: async (): Promise<UserPublic[]> => {
    const response = await axiosInstance.get<UserPublic[]>('/admin/usuarios');
    return response.data;
  },

  // Activar usuario (disabled = false)
  activarUsuario: async (id: number): Promise<UserPublic> => {
    const response = await axiosInstance.post<UserPublic>(`/admin/usuarios/${id}/activar`);
    return response.data;
  },

  // Desactivar usuario (disabled = true)
  desactivarUsuario: async (id: number): Promise<UserPublic> => {
    const response = await axiosInstance.post<UserPublic>(`/admin/usuarios/${id}/desactivar`);
    return response.data;
  },
};