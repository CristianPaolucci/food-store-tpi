import { axiosInstance } from '../../../shared/api/axiosInstance';

export interface ResumenPedidos {
  pendientes: number;
  en_preparacion: number;
  entregados: number;
  cancelados: number;
  pedidos_hoy: number;
  ingresos_entregados: number;
}

export const resumenService = {
  getResumen: async (): Promise<ResumenPedidos> => {
    const response = await axiosInstance.get<ResumenPedidos>('/pedidos/resumen');
    return response.data;
  },
};