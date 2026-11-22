import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pedidosService } from '../api/pedidosService';
import type { PedidoCreate } from '../types/pedido.types';

export const useCrearPedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PedidoCreate) => pedidosService.crearPedido(data),
    onSuccess: () => {
      // Invalidamos la query de pedidos para refrescar listas al confirmar
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
};