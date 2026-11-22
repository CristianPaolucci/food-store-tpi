import { useQuery } from '@tanstack/react-query';
import { productosService } from '../api/productosService';
import type { GetProductosParams } from '../api/productosService';

export const useProductos = (params?: GetProductosParams) => {
  return useQuery({
    queryKey: ['productos', params],
    queryFn: () => productosService.getProductos(params),
  });
};