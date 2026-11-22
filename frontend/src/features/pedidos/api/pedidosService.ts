import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { DetallePedidoRead, PedidoCreate, PedidoRead } from '../types/pedido.types';

const STORAGE_KEY_ULTIMOS_PEDIDOS = 'foodstore_ultimos_pedidos_v2';

type AnyRecord = Record<string, unknown>;

export interface PedidoRespaldoLocal extends PedidoRead {
  hora_exacta?: string;
}

const leerNumeroSeguro = (obj: AnyRecord, keys: string[]): number | undefined => {
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      const num = Number(obj[key]);
      if (!Number.isNaN(num)) return num;
    }
  }
  return undefined;
};

const leerTextoSeguro = (obj: AnyRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    if (key in obj && typeof obj[key] === 'string' && obj[key].trim().length > 0) {
      return obj[key].trim();
    }
  }
  return undefined;
};

export const guardarPedidoRespaldoLocal = (pedido: PedidoRespaldoLocal): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ULTIMOS_PEDIDOS);
    const actuales: PedidoRespaldoLocal[] = raw ? (JSON.parse(raw) as PedidoRespaldoLocal[]) : [];
    const sinDuplicados = actuales.filter(
      (p) => !(pedido.id > 0 && p.id === pedido.id)
    );
    const actualizados = [pedido, ...sinDuplicados].slice(0, 30);
    localStorage.setItem(STORAGE_KEY_ULTIMOS_PEDIDOS, JSON.stringify(actualizados));
  } catch {
    // Ignorar errores de storage
  }
};

export const obtenerPedidosRespaldoLocal = (): PedidoRespaldoLocal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ULTIMOS_PEDIDOS);
    return raw ? (JSON.parse(raw) as PedidoRespaldoLocal[]) : [];
  } catch {
    return [];
  }
};

const normalizarPedido = (
  rawInput: unknown,
  respaldo?: Partial<PedidoRespaldoLocal>
): PedidoRespaldoLocal => {
  const baseObj = (rawInput && typeof rawInput === 'object' ? rawInput : {}) as AnyRecord;

  const src: AnyRecord =
    baseObj.pedido && typeof baseObj.pedido === 'object'
      ? (baseObj.pedido as AnyRecord)
      : baseObj.data &&
        typeof baseObj.data === 'object' &&
        ('id' in (baseObj.data as AnyRecord) ||
          'pedido_id' in (baseObj.data as AnyRecord) ||
          'total' in (baseObj.data as AnyRecord))
      ? (baseObj.data as AnyRecord)
      : baseObj;

  const idDetectado =
    leerNumeroSeguro(src, ['id', 'pedido_id', 'pedidoId', 'order_id']) ??
    leerNumeroSeguro(baseObj, ['id', 'pedido_id']) ??
    respaldo?.id ??
    0;

  const usuarioIdDetectado =
    leerNumeroSeguro(src, ['usuario_id', 'usuarioId', 'user_id']) ?? respaldo?.usuario_id ?? 0;

  const rawDetallesCandidatos =
    src.detalles ??
    src.items ??
    src.detalle_pedidos ??
    src.detalles_pedido ??
    src.order_items ??
    (baseObj.detalles as unknown) ??
    (baseObj.items as unknown);

  const rawDetallesApi: AnyRecord[] = Array.isArray(rawDetallesCandidatos)
    ? (rawDetallesCandidatos as AnyRecord[])
    : [];

  const detallesApiNormalizados: DetallePedidoRead[] = rawDetallesApi.map((det) => {
    const prodObj =
      det.producto && typeof det.producto === 'object' ? (det.producto as AnyRecord) : undefined;

    const cantidad = leerNumeroSeguro(det, ['cantidad', 'qty', 'quantity']) ?? 1;

    const precioUnitario =
      leerNumeroSeguro(det, ['precio_unitario', 'precioUnitario', 'precio', 'unit_price']) ??
      (prodObj
        ? leerNumeroSeguro(prodObj, ['precio_base', 'precioBase', 'precio', 'price'])
        : undefined) ??
      0;

    const subtotal =
      leerNumeroSeguro(det, ['subtotal', 'sub_total', 'total_item']) ??
      Number((precioUnitario * cantidad).toFixed(2));

    const nombreProducto =
      leerTextoSeguro(det, ['nombre_producto', 'nombreProducto', 'nombre', 'titulo']) ??
      (prodObj ? leerTextoSeguro(prodObj, ['nombre', 'titulo', 'name']) : undefined) ??
      'Producto';

    const productoId =
      leerNumeroSeguro(det, ['producto_id', 'productoId', 'product_id']) ??
      (prodObj ? leerNumeroSeguro(prodObj, ['id']) : undefined) ??
      0;

    return {
      producto_id: productoId,
      nombre_producto: nombreProducto,
      precio_unitario: precioUnitario,
      cantidad,
      subtotal,
    };
  });

  const detallesFinales: DetallePedidoRead[] =
    detallesApiNormalizados.length > 0
      ? detallesApiNormalizados
      : Array.isArray(respaldo?.items)
      ? respaldo.items
      : [];

  const sumaItems = detallesFinales.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);

  const totalDetectado =
    leerNumeroSeguro(src, ['total', 'total_pedido', 'monto_total', 'monto', 'precio_total']) ??
    respaldo?.total;

  const totalFinal =
    totalDetectado !== undefined && totalDetectado > 0 ? totalDetectado : sumaItems;

  const direccionDetectada =
    leerTextoSeguro(src, [
      'direccion_entrega',
      'direccionEntrega',
      'direccion',
      'address',
      'domicilio',
    ]) ??
    respaldo?.direccion_entrega ??
    '';

  const notasDetectadas =
    leerTextoSeguro(src, [
      'notas',
      'observaciones',
      'aclaraciones',
      'piso_timbre',
      'timbre',
      'comentario',
    ]) ?? respaldo?.notas;

  const formaPagoDetectada = (leerTextoSeguro(src, [
    'forma_pago',
    'formaPago',
    'metodo_pago',
    'metodoPago',
    'payment_method',
  ]) ??
    respaldo?.forma_pago ??
    'EFECTIVO') as PedidoRead['forma_pago'];

  const estadoDetectado = (leerTextoSeguro(src, ['estado', 'status']) ??
    respaldo?.estado ??
    'PENDIENTE') as PedidoRead['estado'];

  const fechaDetectada =
    leerTextoSeguro(src, ['created_at', 'createdAt', 'fecha_creacion', 'fecha']) ??
    respaldo?.created_at ??
    new Date().toISOString();

  return {
    id: idDetectado,
    usuario_id: usuarioIdDetectado,
    estado: estadoDetectado,
    forma_pago: formaPagoDetectada,
    direccion_entrega: direccionDetectada,
    notas: notasDetectadas,
    total: Number.isNaN(totalFinal) ? 0 : totalFinal,
    created_at: fechaDetectada,
    updated_at:
      leerTextoSeguro(src, ['updated_at', 'updatedAt', 'fecha_actualizacion']) ??
      respaldo?.updated_at ??
      fechaDetectada,
    items: detallesFinales,
    hora_exacta: respaldo?.hora_exacta || fechaDetectada,
  };
};

export const pedidosService = {
  // Crear un nuevo pedido a partir de los items del carrito
  crearPedido: async (data: PedidoCreate): Promise<PedidoRespaldoLocal> => {
    const response = await axiosInstance.post<unknown>('/pedidos/', data);
    return normalizarPedido(response.data, {
      direccion_entrega: data.direccion_entrega,
      forma_pago: data.forma_pago,
      notas: data.notas,
      total: 0,
    });
  },

  // Obtener pedidos del usuario actual o del administrador
  getMisPedidos: async (): Promise<{ total: number; items: PedidoRespaldoLocal[] }> => {
    const response = await axiosInstance.get<unknown>('/pedidos/');
    const payload = response.data as
      | { total?: number; items?: unknown[]; data?: unknown[] | { items?: unknown[] } }
      | unknown[];

    let listaRaw: unknown[] = [];
    if (Array.isArray(payload)) {
      listaRaw = payload;
    } else if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.items)) {
        listaRaw = payload.items;
      } else if (Array.isArray(payload.data)) {
        listaRaw = payload.data;
      } else if (
        payload.data &&
        typeof payload.data === 'object' &&
        Array.isArray(payload.data.items)
      ) {
        listaRaw = payload.data.items;
      }
    }

    const locales = obtenerPedidosRespaldoLocal();
    const usados = new Set<number>();

    const items = listaRaw.map((rawItem, idx) => {
      const candidate = rawItem as AnyRecord;
      const rawId = leerNumeroSeguro(candidate, ['id', 'pedido_id', 'pedidoId']);
      const dirApi = leerTextoSeguro(candidate, [
        'direccion_entrega',
        'direccionEntrega',
        'direccion',
      ]);

      let matchIndex = -1;
      if (rawId !== undefined && rawId > 0) {
        matchIndex = locales.findIndex((l, i) => !usados.has(i) && l.id === rawId);
      }
      if (matchIndex === -1 && dirApi) {
        matchIndex = locales.findIndex(
          (l, i) =>
            !usados.has(i) &&
            l.direccion_entrega.toLowerCase() === dirApi.toLowerCase()
        );
      }
      if (matchIndex === -1 && locales[idx] && !usados.has(idx)) {
        matchIndex = idx;
      }

      const matchLocal = matchIndex >= 0 ? locales[matchIndex] : undefined;
      if (matchIndex >= 0) usados.add(matchIndex);

      return normalizarPedido(rawItem, matchLocal);
    });

    const total =
      payload && !Array.isArray(payload) && typeof payload.total === 'number'
        ? payload.total
        : items.length;

    return { total, items };
  },

  // Cancelar un pedido en estado PENDIENTE
  cancelarPedido: async (id: number): Promise<PedidoRespaldoLocal> => {
    const response = await axiosInstance.patch<unknown>(`/pedidos/${id}/cancelar`);
    const actuales = obtenerPedidosRespaldoLocal();
    const previo = actuales.find((p) => p.id === id);
    const actualizado = normalizarPedido(response.data, {
      ...previo,
      id,
      estado: 'CANCELADO',
    });
    guardarPedidoRespaldoLocal(actualizado);
    return actualizado;
  },
};