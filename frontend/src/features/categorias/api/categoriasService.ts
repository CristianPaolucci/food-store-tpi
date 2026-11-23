import { axiosInstance } from '../../../shared/api/axiosInstance';

export interface CategoriaRead {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string;
}

export interface CategoriaUpdate {
  nombre?: string;
  descripcion?: string;
}

export const categoriasService = {
  // Listar categorías activas (público / admin)
  getCategorias: async (): Promise<CategoriaRead[]> => {
    const response = await axiosInstance.get<CategoriaRead[]>('/categorias');
    return response.data;
  },

  // Crear categoría (solo admin)
  crearCategoria: async (data: CategoriaCreate): Promise<CategoriaRead> => {
    const response = await axiosInstance.post<CategoriaRead>('/categorias', data);
    return response.data;
  },

  // Actualizar categoría (solo admin)
  actualizarCategoria: async (id: number, data: CategoriaUpdate): Promise<CategoriaRead> => {
    const response = await axiosInstance.put<CategoriaRead>(`/categorias/${id}`, data);
    return response.data;
  },

  // Baja lógica de categoría (solo admin, responde 204)
  eliminarCategoria: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categorias/${id}`);
  },
};