import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../api/adminService';
import { AdminNav } from './AdminResumenPage';
import { handleApiError } from '../../../shared/api/handleApiError';
import type {
  DetallePedidoRead,
  EstadoPedido,
  FormaPago,
  PedidoRead,
} from '../../pedidos/types/pedido.types';

const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

interface PedidoAdminView extends PedidoRead {
  usuario_nombre?: string;
}

interface AvisoModalState {
  tipo: 'exito' | 'error';
  titulo: string;
  mensaje: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizarItem = (raw: any): DetallePedidoRead => {
  const cantidad = Number(raw?.cantidad ?? 0);
  const precioUnitario = Number(raw?.precio_unitario ?? raw?.precio ?? 0);
  const subtotalCalculado =
    raw?.subtotal !== undefined && raw?.subtotal !== null
      ? Number(raw.subtotal)
      : cantidad * precioUnitario;

  return {
    producto_id: Number(raw?.producto_id ?? raw?.producto?.id ?? 0),
    nombre_producto: String(
      raw?.nombre_producto ?? raw?.producto_nombre ?? raw?.producto?.nombre ?? 'Producto'
    ),
    precio_unitario: precioUnitario,
    cantidad,
    subtotal: Number.isNaN(subtotalCalculado) ? 0 : subtotalCalculado,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizarPedido = (raw: any): PedidoAdminView => {
  const rawItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.detalles)
    ? raw.detalles
    : Array.isArray(raw?.productos)
    ? raw.productos
    : [];

  const items: DetallePedidoRead[] = rawItems.map(normalizarItem);
  const sumaItems = items.reduce(
    (acc: number, item: DetallePedidoRead) => acc + Number(item.subtotal || 0),
    0
  );

  const rawTotal =
    raw?.total ?? raw?.monto_total ?? raw?.precio_total ?? raw?.importe_total;
  const total =
    rawTotal !== undefined && rawTotal !== null && !Number.isNaN(Number(rawTotal))
      ? Number(rawTotal)
      : sumaItems;

  const estadoRaw = String(raw?.estado ?? 'PENDIENTE').toUpperCase() as EstadoPedido;
  const estado: EstadoPedido =
    estadoRaw === 'PENDIENTE' ||
    estadoRaw === 'EN_PREPARACION' ||
    estadoRaw === 'ENTREGADO' ||
    estadoRaw === 'CANCELADO'
      ? estadoRaw
      : 'PENDIENTE';

  const usuarioNombreRaw =
    raw?.usuario?.username ?? raw?.usuario?.nombre ?? raw?.usuario_nombre ?? '';
  const usuarioNombre = String(usuarioNombreRaw).trim() || undefined;

  return {
    id: Number(raw?.id ?? raw?.pedido_id ?? 0),
    usuario_id: Number(raw?.usuario_id ?? raw?.user_id ?? raw?.usuario?.id ?? 0),
    usuario_nombre: usuarioNombre,
    estado,
    forma_pago: (raw?.forma_pago ?? raw?.metodo_pago ?? '-') as FormaPago,
    direccion_entrega: String(raw?.direccion_entrega ?? raw?.direccion ?? '-'),
    notas: raw?.notas ? String(raw.notas) : undefined,
    total,
    created_at: String(raw?.created_at ?? raw?.fecha_creacion ?? raw?.fecha ?? ''),
    updated_at: String(raw?.updated_at ?? raw?.fecha_actualizacion ?? raw?.created_at ?? ''),
    items,
  };
};

export const AdminPedidosPage = () => {
  const queryClient = useQueryClient();
  const [avisoModal, setAvisoModal] = useState<AvisoModalState | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'pedidos'],
    queryFn: () => adminService.getTodosLosPedidos(),
  });

  const actualizarEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) =>
      adminService.actualizarEstadoPedido(id, estado),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'resumen'] });
      setAvisoModal({
        tipo: 'exito',
        titulo: 'Estado actualizado',
        mensaje: `El pedido #${variables.id} pasó a ${variables.estado}.`,
      });
    },
    onError: (err: unknown) => {
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo actualizar',
        mensaje: handleApiError(err),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="flex h-64 items-center justify-center font-medium text-gray-600">
          Cargando panel de administración...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium max-w-xl mx-auto mt-8 shadow-xs">
          Error al cargar los pedidos del sistema. Asegúrate de contar con permisos de administrador.
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawList: any[] = Array.isArray((data as any)?.items)
    ? (data as any).items
    : Array.isArray(data)
    ? data
    : [];

  const pedidos: PedidoAdminView[] = rawList
    .map(normalizarPedido)
    .filter((pedido) => pedido.id > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <AdminNav />

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Panel de Gestión de Pedidos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Controlá el avance de los pedidos de clientes y actualizá su estado.
          </p>
        </div>
        <span className="inline-flex items-center self-start sm:self-auto text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
          Total: {pedidos.length} pedidos
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 rounded-2xl text-center shadow-xs">
          <p className="text-gray-600 font-medium">No hay pedidos registrados en el sistema.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido: PedidoAdminView) => {
            const siguientesEstados = TRANSICIONES_VALIDAS[pedido.estado] || [];
            const fechaFormateada =
              pedido.created_at && !Number.isNaN(new Date(pedido.created_at).getTime())
                ? new Date(pedido.created_at).toLocaleString('es-AR')
                : pedido.created_at || '-';

            const etiquetaUsuario = pedido.usuario_nombre
              ? `${pedido.usuario_nombre} (ID: ${pedido.usuario_id})`
              : `ID: ${pedido.usuario_id}`;

            return (
              <div
                key={`pedido-${pedido.id}`}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                      Pedido #{pedido.id} — Usuario: {etiquetaUsuario}
                    </span>
                    <span className="text-sm text-gray-600">Fecha: {fechaFormateada}</span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        pedido.estado === 'PENDIENTE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : pedido.estado === 'EN_PREPARACION'
                          ? 'bg-blue-100 text-blue-800'
                          : pedido.estado === 'ENTREGADO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {pedido.estado}
                    </span>

                    {siguientesEstados.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          const nuevoEstado = e.target.value as EstadoPedido;
                          if (nuevoEstado) {
                            actualizarEstadoMutation.mutate({
                              id: pedido.id,
                              estado: nuevoEstado,
                            });
                          }
                        }}
                        disabled={actualizarEstadoMutation.isPending}
                        className="border border-gray-300 rounded-lg text-xs py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
                      >
                        <option value="">Cambiar estado...</option>
                        {siguientesEstados.map((estadoDestino) => (
                          <option key={estadoDestino} value={estadoDestino}>
                            {estadoDestino}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Ítems solicitados
                  </span>
                  {pedido.items.length === 0 ? (
                    <p className="text-sm text-gray-500 py-1">
                      Sin detalle de ítems disponible.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100 text-sm">
                      {pedido.items.map((item, idx) => (
                        <li key={idx} className="py-1.5 flex justify-between text-gray-600">
                          <span>
                            {item.cantidad}x {item.nombre_producto}
                          </span>
                          <span className="font-semibold text-gray-900">
                            ${Number(item.subtotal).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                  <div>
                    <p className="text-gray-600">
                      <strong>Dirección:</strong> {pedido.direccion_entrega}
                    </p>
                    <p className="text-gray-600">
                      <strong>Pago:</strong> {pedido.forma_pago}
                    </p>
                    {pedido.notas && (
                      <p className="text-gray-600">
                        <strong>Notas:</strong> {pedido.notas}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Total</span>
                    <span className="text-lg font-extrabold text-gray-900">
                      ${Number(pedido.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {avisoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 p-6 text-center space-y-4">
            <div
              className={`w-16 h-16 mx-auto rounded-full border flex items-center justify-center text-4xl shadow-xs ${
                avisoModal.tipo === 'exito'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {avisoModal.tipo === 'exito' ? '✅' : '⚠️'}
            </div>
            <div className="space-y-1">
              <span
                className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border ${
                  avisoModal.tipo === 'exito'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {avisoModal.titulo}
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 pt-1">{avisoModal.mensaje}</h3>
            </div>
            <button
              type="button"
              onClick={() => setAvisoModal(null)}
              className={`w-full py-2.5 px-4 rounded-xl text-white transition-colors text-sm font-semibold shadow-sm ${
                avisoModal.tipo === 'exito'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};