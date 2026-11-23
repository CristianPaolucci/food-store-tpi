import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosInstance } from '../shared/api/axiosInstance';

export interface User {
  id: number;
  username: string;
  full_name?: string | null;
  email: string;
  role: 'user' | 'admin';
  disabled: boolean;
  created_at?: string | null;
}

interface AuthState {
  usuario: User | null;
  cargando: boolean;
  setUsuario: (usuario: User | null) => void;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,
      setUsuario: (usuario) => set({ usuario, cargando: false }),
      checkSession: async () => {
        try {
          set({ cargando: true });
          const response = await axiosInstance.get<User>('/auth/me');
          set({ usuario: response.data, cargando: false });
        } catch {
          set({ usuario: null, cargando: false });
        }
      },
      logout: async () => {
        try {
          await axiosInstance.post('/auth/logout');
        } catch (error) {
          console.error('Error al cerrar sesión', error);
        } finally {
          try {
            localStorage.removeItem('foodstore_ultimos_pedidos_v2');
          } catch {
            // Ignorar errores de storage
          }
          set({ usuario: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ usuario: state.usuario }), // Solo guarda el usuario, nunca tokens ya que usamos cookies HttpOnly
    }
  )
);