import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { ProductosPaginados, Producto } from '../types/producto.types';

export interface GetProductosParams {
  skip?: number;
  limit?: number;
  search?: string;
  categoria_id?: number;
  disponible?: boolean;
}

export const productosService = {
  // Obtener catálogo público adaptando el arreglo de FastAPI a la estructura paginada
  getProductos: async (params?: GetProductosParams): Promise<ProductosPaginados> => {
    const response = await axiosInstance.get<Producto[]>('/productos/', {
      params,
    });
    
    const data = Array.isArray(response.data) ? response.data : [];
    
    return {
      items: data,
      total: data.length,
    };
  },

  getProductoById: async (id: number): Promise<Producto> => {
    const response = await axiosInstance.get<Producto>(`/productos/${id}`);
    return response.data;
  },
};