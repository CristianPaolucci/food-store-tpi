export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO';
export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA';

export interface ItemPedidoCreate {
  producto_id: number;
  cantidad: number;
}

export interface PedidoCreate {
  items: ItemPedidoCreate[];
  forma_pago: FormaPago;
  direccion_entrega: string;
  notas?: string;
}

export interface DetallePedidoRead {
  producto_id: number;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

export interface PedidoRead {
  id: number;
  usuario_id: number;
  usuario_username?: string;
  estado: EstadoPedido;
  forma_pago: FormaPago;
  direccion_entrega: string;
  notas?: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: DetallePedidoRead[];
}