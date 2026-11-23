import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  guardarPedidoRespaldoLocal,
  obtenerPedidosRespaldoLocal,
  pedidosService,
  type PedidoRespaldoLocal,
} from '../api/pedidosService';
import { Button } from '../../../shared/ui/Button';
import { handleApiError } from '../../../shared/api/handleApiError';
import { useAuthStore } from '../../../store/authStore';
import { useState, useEffect } from 'react';

interface DetalleExtendido {
  producto_id?: number;
  nombre_producto?: string;
  producto?: { nombre?: string; precio_base?: number; precio?: number };
  precio_unitario?: number;
  cantidad: number;
  subtotal?: number;
}

type PedidoExtendido = PedidoRespaldoLocal & {
  id_real?: number;
  numero_visible?: number;
  clave_unica?: string;
  detalles?: DetalleExtendido[];
};

interface AvisoModalState {
  tipo: 'exito' | 'error';
  titulo: string;
  mensaje: string;
}

const obtenerEmojiEstado = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE':
      return '⏳';
    case 'EN_PREPARACION':
      return '👨‍🍳';
    case 'ENTREGADO':
      return '✅';
    case 'CANCELADO':
      return '❌';
    default:
      return '📦';
  }
};

const formatearFechaHoraExacta = (fechaStr?: string): string => {
  if (!fechaStr) return '-';
  const fecha = new Date(fechaStr);
  if (Number.isNaN(fecha.getTime())) return fechaStr;

  const dia = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaExacta = fecha.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${dia} a las ${horaExacta} hs`;
};

const formatearMensajeErrorCancelacion = (mensajeOriginal: string): string => {
  const normalizado = mensajeOriginal.toLowerCase();
  if (
    normalizado.includes('no autenticado') ||
    normalizado.includes('falta cookie') ||
    normalizado.includes('token inválido') ||
    normalizado.includes('token invalido') ||
    normalizado.includes('expirado')
  ) {
    return 'Tu sesión venció o no se pudo verificar. Iniciá sesión nuevamente para cancelar el pedido.';
  }
  return mensajeOriginal;
};

export const MisPedidosPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);
  const [avisoModal, setAvisoModal] = useState<AvisoModalState | null>(null);
  const [pedidoACancelar, setPedidoACancelar] = useState<PedidoExtendido | null>(null);
  const [pedidoAEditar, setPedidoAEditar] = useState<PedidoExtendido | null>(null);

  const [direccionEdit, setDireccionEdit] = useState('');
  const [notasEdit, setNotasEdit] = useState('');
  const [edicionesLocales, setEdicionesLocales] = useState<
    Record<string, { direccion_entrega: string; notas?: string; estado?: PedidoExtendido['estado'] }>
  >({});

  useEffect(() => {
    if (pedidoAEditar) {
      setDireccionEdit(pedidoAEditar.direccion_entrega || '');
      setNotasEdit(pedidoAEditar.notas || '');
    }
  }, [pedidoAEditar]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pedidos', 'mis-pedidos', usuario?.id ?? 'anon'],
    queryFn: () => pedidosService.getMisPedidos(),
    retry: 1,
  });

  const aplicarCancelacionLocal = (pedido: PedidoExtendido, mensajeCorto?: string) => {
    const clave = pedido.clave_unica || String(pedido.numero_visible ?? pedido.id);
    setEdicionesLocales((prev) => ({
      ...prev,
      [clave]: {
        direccion_entrega: prev[clave]?.direccion_entrega ?? pedido.direccion_entrega,
        notas: prev[clave]?.notas ?? pedido.notas,
        estado: 'CANCELADO',
      },
    }));
    guardarPedidoRespaldoLocal({
      ...pedido,
      estado: 'CANCELADO',
    });
    setPedidoACancelar(null);
    setPedidoAEditar(null);
    setAvisoModal({
      tipo: 'exito',
      titulo: 'Pedido cancelado',
      mensaje: mensajeCorto ?? `El pedido #${pedido.id} fue cancelado.`,
    });
  };

  const cancelarMutation = useMutation({
    mutationFn: async (pedido: PedidoExtendido) => {
      const idObjetivo = pedido.id_real && pedido.id_real > 0 ? pedido.id_real : pedido.id;
      if (idObjetivo > 0) {
        return pedidosService.cancelarPedido(idObjetivo);
      }
      const actualizadoLocal: PedidoRespaldoLocal = {
        ...pedido,
        estado: 'CANCELADO',
      };
      guardarPedidoRespaldoLocal(actualizadoLocal);
      return actualizadoLocal;
    },
    onSuccess: (_res, pedidoEnviado) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      aplicarCancelacionLocal(pedidoEnviado, `El pedido #${pedidoEnviado.id} fue cancelado.`);
    },
    onError: (err: unknown) => {
      const mensaje = handleApiError(err);
      setPedidoACancelar(null);
      setAvisoModal({
        tipo: 'error',
        titulo: 'No se pudo cancelar',
        mensaje: formatearMensajeErrorCancelacion(mensaje),
      });
    },
  });

  const handleGuardarCambiosEntrega = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoAEditar) return;

    const direccionLimpia = direccionEdit.trim();
    if (direccionLimpia.length < 5) {
      setAvisoModal({
        tipo: 'error',
        titulo: 'Dirección inválida',
        mensaje: 'Ingresá una dirección de al menos 5 caracteres.',
      });
      return;
    }

    const notasLimpias = notasEdit.trim() || undefined;
    const clave = pedidoAEditar.clave_unica || String(pedidoAEditar.numero_visible ?? pedidoAEditar.id);

    setEdicionesLocales((prev) => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        direccion_entrega: direccionLimpia,
        notas: notasLimpias,
      },
    }));

    guardarPedidoRespaldoLocal({
      ...pedidoAEditar,
      direccion_entrega: direccionLimpia,
      notas: notasLimpias,
    });

    const idPedido = pedidoAEditar.id;
    setPedidoAEditar(null);
    setAvisoModal({
      tipo: 'exito',
      titulo: 'Cambios guardados',
      mensaje: `Datos actualizados para el pedido #${idPedido}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center font-medium text-gray-600">
        🍽️ Cargando tus pedidos...
      </div>
    );
  }

  const pedidosApi: PedidoExtendido[] = Array.isArray(data?.items)
    ? (data.items as PedidoExtendido[])
    : Array.isArray(data)
    ? (data as PedidoExtendido[])
    : [];

  const pedidosRespaldo: PedidoExtendido[] = isError
    ? (obtenerPedidosRespaldoLocal() as PedidoExtendido[]).filter(
        (p) => !usuario?.id || p.usuario_id === usuario.id
      )
    : [];

  const pedidosCrudos: PedidoExtendido[] =
    pedidosApi.length > 0 ? pedidosApi : pedidosRespaldo;

  if (isError && pedidosCrudos.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white border border-gray-200 rounded-2xl p-6 shadow-md text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
          🍽️
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-gray-900">
            No pudimos actualizar tus pedidos ahora
          </h2>
          <p className="text-sm text-gray-600">
            Revisá tu conexión o volvé a intentar en unos segundos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm"
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">🧾 Mis Pedidos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Revisá el detalle de tus compras, hora exacta, dirección, notas de entrega y estado actual.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span>📋</span>
          <span>
            {pedidosCrudos.length} {pedidosCrudos.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </span>
      </div>

      {pedidosCrudos.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 rounded-xl text-center space-y-3 shadow-md">
          <div className="text-4xl">🛒</div>
          <p className="text-lg font-bold text-gray-800">No tienes pedidos registrados</p>
          <p className="text-sm text-gray-500">
            Tus compras aparecerán aquí una vez que confirmes un pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {pedidosCrudos.map((pedidoBase, idx) => {
            const idReal =
              typeof pedidoBase.id === 'number' && pedidoBase.id > 0 ? pedidoBase.id : undefined;
            const numeroVisible = idReal ?? idx + 1;
            const claveUnica = `${idReal ?? 'local'}-${idx}`;
            const edicion = edicionesLocales[claveUnica] ?? edicionesLocales[String(numeroVisible)];

            const pedido: PedidoExtendido = {
              ...pedidoBase,
              id_real: idReal,
              numero_visible: numeroVisible,
              clave_unica: claveUnica,
              id: numeroVisible,
              usuario_username: pedidoBase.usuario_username,
              direccion_entrega: edicion?.direccion_entrega ?? pedidoBase.direccion_entrega,
              notas: edicion?.notas !== undefined ? edicion.notas : pedidoBase.notas,
              estado: edicion?.estado ?? pedidoBase.estado,
            };

            const listaDetalles: DetalleExtendido[] = Array.isArray(pedido.detalles)
              ? pedido.detalles
              : Array.isArray(pedido.items)
              ? (pedido.items as DetalleExtendido[])
              : [];

            const sumaItems = listaDetalles.reduce((acc, item) => {
              const cant = Number(item.cantidad ?? 1);
              const unit = Number(
                item.precio_unitario ?? item.producto?.precio_base ?? item.producto?.precio ?? 0
              );
              const sub = Number(item.subtotal ?? unit * cant);
              return acc + (Number.isNaN(sub) ? 0 : sub);
            }, 0);

            const totalRaw = Number(pedido.total ?? NaN);
            const totalPedido = !Number.isNaN(totalRaw) && totalRaw > 0 ? totalRaw : sumaItems;

            const direccionTexto =
              pedido.direccion_entrega && pedido.direccion_entrega.trim().length > 0
                ? pedido.direccion_entrega
                : 'Sin dirección registrada';

            const notasTexto =
              pedido.notas && pedido.notas.trim().length > 0 ? pedido.notas.trim() : null;

            const fechaHoraTexto = formatearFechaHoraExacta(
              pedido.hora_exacta || pedido.created_at
            );

            return (
              <div
                key={claveUnica}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow space-y-5"
              >
                {/* Encabezado del pedido */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <span>🧾</span>
                      <span>Pedido #{numeroVisible}</span>
                    </span>
                    <p className="text-xs text-gray-600">
                      👤 Usuario:{' '}
                      <strong className="text-gray-800">
                        {pedido.usuario_username || '-'}
                      </strong>{' '}
                      <span className="text-gray-500">(ID: {pedido.usuario_id || '-'})</span>
                    </p>
                    <p className="text-sm text-gray-600 pt-0.5">
                      🕒 Hecho el: <strong className="text-gray-800">{fechaHoraTexto}</strong>
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                        pedido.estado === 'PENDIENTE'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : pedido.estado === 'EN_PREPARACION'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : pedido.estado === 'ENTREGADO'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      <span>{obtenerEmojiEstado(pedido.estado)}</span>
                      <span>{pedido.estado}</span>
                    </span>

                    {pedido.estado === 'PENDIENTE' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPedidoAEditar(pedido)}
                          disabled={cancelarMutation.isPending}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                        >
                          ✏️ Editar dirección / notas
                        </button>
                        <Button
                          variant="secondary"
                          onClick={() => setPedidoACancelar(pedido)}
                          disabled={cancelarMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Detalle de ítems comprados */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    🍽️ Productos comprados
                  </span>
                  {listaDetalles.length === 0 ? (
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      Sin detalle de ítems disponible.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100 bg-gray-50/70 rounded-xl border border-gray-200/70 px-4 text-sm">
                      {listaDetalles.map((item, index) => {
                        const nombreItem =
                          item.nombre_producto || item.producto?.nombre || 'Producto';
                        const cant = Number(item.cantidad ?? 1);
                        const unit = Number(
                          item.precio_unitario ??
                            item.producto?.precio_base ??
                            item.producto?.precio ??
                            0
                        );
                        const subtotalItem = Number(item.subtotal ?? unit * cant);

                        return (
                          <li
                            key={index}
                            className="py-2.5 flex justify-between items-center text-gray-700 gap-2"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-indigo-100 text-indigo-800 font-bold text-xs px-2 py-0.5 rounded-md">
                                {cant}x
                              </span>
                              <span className="font-semibold text-gray-900">{nombreItem}</span>
                              {unit > 0 && (
                                <span className="text-xs text-gray-500">
                                  (${unit.toFixed(2)} c/u)
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-gray-900">
                              ${(Number.isNaN(subtotalItem) ? 0 : subtotalItem).toFixed(2)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Información de Entrega y Total */}
                <div className="bg-gradient-to-r from-gray-50 to-indigo-50/40 p-4 rounded-xl border border-gray-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-700">
                      <strong className="text-gray-900">📍 Dirección:</strong> {direccionTexto}
                    </p>
                    <p className="text-gray-700">
                      <strong className="text-gray-900">
                        {pedido.forma_pago === 'TRANSFERENCIA' ? '🏦' : '💵'} Pago:
                      </strong>{' '}
                      {pedido.forma_pago || 'No especificado'}
                    </p>
                    <p className="text-gray-700">
                      <strong className="text-gray-900">🔔 Timbre / Piso / Notas:</strong>{' '}
                      {notasTexto || 'Sin aclaraciones'}
                    </p>
                  </div>
                  <div className="sm:text-right bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-xs self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:items-end">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Total</span>
                    <span className="text-xl font-extrabold text-gray-900">
                      ${totalPedido.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL VISUAL DE AVISO (ÉXITO / ERROR) */}
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

      {/* MODAL DE CONFIRMACIÓN PARA CANCELAR PEDIDO */}
      {pedidoACancelar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 p-6 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-4xl shadow-xs">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Confirmación de cancelación
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                ¿Cancelar pedido #{pedidoACancelar.id}? 🛑
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Como todavía está en estado <strong>PENDIENTE</strong>, podés cancelarlo y se
                devolverá el stock de tus productos.
              </p>
            </div>
            <div className="pt-1 flex gap-3">
              <button
                type="button"
                onClick={() => setPedidoACancelar(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
              >
                Mantener pedido
              </button>
              <button
                type="button"
                disabled={cancelarMutation.isPending}
                onClick={() => cancelarMutation.mutate(pedidoACancelar)}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold shadow-md shadow-red-200"
              >
                {cancelarMutation.isPending ? 'Cancelando...' : '🗑️ Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERAL PARA MODIFICAR DIRECCIÓN / NOTAS O CANCELAR PEDIDO */}
      {pedidoAEditar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 p-6 space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-4xl shadow-xs">
                ✏️
              </div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Datos de entrega · Pedido #{pedidoAEditar.id}
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                ¿Querés modificar la dirección o notas? 🏠
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Podés actualizar tu dirección o timbre/piso/notas mientras el pedido esté{' '}
                <strong>PENDIENTE</strong>, o bien cancelarlo para armar uno nuevo.
              </p>
            </div>

            <form onSubmit={handleGuardarCambiosEntrega} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  📍 Dirección de entrega
                </label>
                <input
                  type="text"
                  value={direccionEdit}
                  onChange={(e) => setDireccionEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej. San Martín 23"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  🔔 Timbre / Piso / Notas
                </label>
                <input
                  type="text"
                  value={notasEdit}
                  onChange={(e) => setNotasEdit(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej. Piso 2, timbre B o llegar en 10 minutos"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setPedidoAEditar(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={cancelarMutation.isPending}
                  onClick={() => {
                    const objetivo = pedidoAEditar;
                    cancelarMutation.mutate(objetivo, {
                      onSuccess: () => {
                        navigate('/');
                      },
                    });
                  }}
                  className="flex-1 bg-amber-50 text-amber-800 border border-amber-200 py-2.5 px-4 rounded-xl hover:bg-amber-100 transition-colors text-sm font-semibold"
                >
                  🔄 Cancelar y rehacer
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-md shadow-indigo-200"
                >
                  💾 Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};