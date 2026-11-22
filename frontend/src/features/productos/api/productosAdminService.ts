import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { Producto } from '../types/producto.types';

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  precio_base: number;
  imagen_url: string;
  stock: number;
  disponible: boolean;
  categoria_id: number;
}

export interface ProductoStockUpdate {
  stock: number;
  disponible: boolean;
}

export const productosAdminService = {
  // Crear producto (solo admin)
  crearProducto: async (data: ProductoCreate): Promise<Producto> => {
    const response = await axiosInstance.post<Producto>('/productos', data);
    return response.data;
  },

  // Actualizar producto (solo admin)
  actualizarProducto: async (id: number, data: Partial<ProductoCreate>): Promise<Producto> => {
    const response = await axiosInstance.put<Producto>(`/productos/${id}`, data);
    return response.data;
  },

  // Actualizar stock y disponibilidad (PATCH /productos/{id}/stock)
  actualizarStock: async (id: number, data: ProductoStockUpdate): Promise<Producto> => {
    const response = await axiosInstance.patch<Producto>(`/productos/${id}/stock`, data);
    return response.data;
  },

  // Baja lógica de producto (DELETE /productos/{id} -> 204)
  eliminarProducto: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/productos/${id}`);
  },
};