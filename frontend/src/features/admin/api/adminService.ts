import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { PedidoRead, EstadoPedido } from '../../pedidos/types/pedido.types';

export interface ResumenPedidos {
  pendientes: number;
  en_preparacion: number;
  entregados: number;
  cancelados: number;
  pedidos_hoy: number;
  ingresos_entregados: number;
}

export interface UsuarioAdmin {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  disabled: boolean;
  created_at: string;
}

export const adminService = {
  // Obtener el resumen del negocio (Ruta oficial del TPI: /pedidos/resumen)[cite: 26]
  getResumen: async (): Promise<ResumenPedidos> => {
    const response = await axiosInstance.get<ResumenPedidos>('/pedidos/resumen');
    return response.data;
  },

  // Obtener todos los pedidos del sistema (rol admin)
  getTodosLosPedidos: async (): Promise<{ total: number; items: PedidoRead[] }> => {
    const response = await axiosInstance.get<{ total: number; items: PedidoRead[] }>('/admin/pedidos');
    return response.data;
  },

  // Actualizar el estado de un pedido (ej: PENDIENTE -> EN_PREPARACION -> ENTREGADO)
  actualizarEstadoPedido: async (id: number, estado: EstadoPedido): Promise<PedidoRead> => {
    const response = await axiosInstance.patch<PedidoRead>(`/admin/pedidos/${id}/estado`, { estado });
    return response.data;
  },

  // Listar usuarios para el panel de administración
  getUsuarios: async (): Promise<UsuarioAdmin[]> => {
    const response = await axiosInstance.get<UsuarioAdmin[]>('/admin/usuarios');
    return response.data;
  },

  // Activar usuario (disabled = false)
  activarUsuario: async (id: number): Promise<UsuarioAdmin> => {
    const response = await axiosInstance.post<UsuarioAdmin>(`/admin/usuarios/${id}/activar`);
    return response.data;
  },

  // Desactivar usuario (disabled = true)
  desactivarUsuario: async (id: number): Promise<UsuarioAdmin> => {
    const response = await axiosInstance.post<UsuarioAdmin>(`/admin/usuarios/${id}/desactivar`);
    return response.data;
  },
};