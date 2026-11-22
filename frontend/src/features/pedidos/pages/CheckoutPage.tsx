import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../../store/cartStore';
import {
  guardarPedidoRespaldoLocal,
  pedidosService,
  type PedidoRespaldoLocal,
} from '../api/pedidosService';
import { Button } from '../../../shared/ui/Button';
import type { DetallePedidoRead, PedidoCreate, PedidoRead } from '../types/pedido.types';

interface ResumenConfirmacion {
  pedido: PedidoRead;
  totalAbonado: number;
  direccion: string;
  formaPago: 'EFECTIVO' | 'TRANSFERENCIA';
  notas?: string;
  itemsComprados: DetallePedidoRead[];
  horaExacta: string;
}

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, vaciar, total } = useCartStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumenConfirmacion, setResumenConfirmacion] = useState<ResumenConfirmacion | null>(null);

  const form = useForm({
    defaultValues: {
      direccion_entrega: '',
      forma_pago: 'EFECTIVO' as 'EFECTIVO' | 'TRANSFERENCIA',
      notas: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setIsSubmitting(true);

      try {
        const direccionLimpia = value.direccion_entrega.trim();
        if (direccionLimpia.length < 5 || direccionLimpia.length > 200) {
          setSubmitError(
            'La dirección de entrega debe tener entre 5 y 200 caracteres (RN-06).'
          );
          return;
        }

        const totalCarritoActual = Number(total());
        const notasLimpias = value.notas.trim() || undefined;
        const ahoraIso = new Date().toISOString();

        const snapshotDetalles: DetallePedidoRead[] = items.map((item) => {
          const itemExt = item as {
            producto_id?: number;
            id?: number;
            nombre?: string;
            titulo?: string;
            precio_unitario: number;
            cantidad: number;
          };
          const cant = Number(itemExt.cantidad || 1);
          const unit = Number(itemExt.precio_unitario || 0);
          return {
            producto_id: Number(itemExt.producto_id ?? itemExt.id ?? 0),
            nombre_producto: itemExt.nombre || itemExt.titulo || 'Producto',
            precio_unitario: unit,
            cantidad: cant,
            subtotal: Number((unit * cant).toFixed(2)),
          };
        });

        const payload: PedidoCreate = {
          items: snapshotDetalles.map((det) => ({
            producto_id: det.producto_id,
            cantidad: det.cantidad,
          })),
          forma_pago: value.forma_pago,
          direccion_entrega: direccionLimpia,
          notas: notasLimpias,
        };

        const pedidoCreado = await pedidosService.crearPedido(payload);
        const sumaSnapshot = snapshotDetalles.reduce((acc, d) => acc + d.subtotal, 0);
        const totalFinal =
          typeof pedidoCreado.total === 'number' && pedidoCreado.total > 0
            ? pedidoCreado.total
            : totalCarritoActual > 0
            ? totalCarritoActual
            : sumaSnapshot;

        const itemsFinales =
          Array.isArray(pedidoCreado.items) && pedidoCreado.items.length > 0
            ? pedidoCreado.items
            : snapshotDetalles;

        const direccionFinal = pedidoCreado.direccion_entrega || direccionLimpia;
        const formaPagoFinal = (pedidoCreado.forma_pago || value.forma_pago) as
          | 'EFECTIVO'
          | 'TRANSFERENCIA';
        const notasFinales = pedidoCreado.notas || notasLimpias;
        const fechaFinal = pedidoCreado.created_at || ahoraIso;

        const respaldoCompleto: PedidoRespaldoLocal = {
          ...pedidoCreado,
          id: pedidoCreado.id && pedidoCreado.id > 0 ? pedidoCreado.id : 0,
          estado: pedidoCreado.estado || 'PENDIENTE',
          forma_pago: formaPagoFinal,
          direccion_entrega: direccionFinal,
          notas: notasFinales,
          total: totalFinal,
          created_at: fechaFinal,
          updated_at: fechaFinal,
          hora_exacta: fechaFinal,
          items: itemsFinales,
        };

        guardarPedidoRespaldoLocal(respaldoCompleto);
        vaciar();

        setResumenConfirmacion({
          pedido: respaldoCompleto,
          totalAbonado: totalFinal,
          direccion: direccionFinal,
          formaPago: formaPagoFinal,
          notas: notasFinales,
          itemsComprados: itemsFinales,
          horaExacta: fechaFinal,
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } }; message?: string };
        const detalle =
          err.response?.data?.detail ||
          err.message ||
          'No se pudo confirmar el pedido. Revisá los datos e intentá nuevamente.';
        console.error('Error al crear el pedido:', err.response?.data || err.message);
        setSubmitError(detalle);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  if (resumenConfirmacion) {
    const {
      pedido,
      totalAbonado,
      direccion,
      formaPago,
      notas,
      itemsComprados,
      horaExacta,
    } = resumenConfirmacion;
    const emojiPago = formaPago === 'TRANSFERENCIA' ? '🏦' : '💵';
    const fechaObj = new Date(horaExacta);
    const textoHora = Number.isNaN(fechaObj.getTime())
      ? '-'
      : `${fechaObj.toLocaleDateString()} ${fechaObj.toLocaleTimeString()}`;

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 p-6 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-4xl shadow-xs">
            🎉
          </div>

          <div className="space-y-1.5">
            <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✅ Pedido Confirmado
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900">
              ¡Gracias por tu compra! 🍽️
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tu pedido {pedido.id > 0 ? <strong>#{pedido.id}</strong> : null} ya está registrado y
              en marcha.
            </p>
            <p className="text-xs font-medium text-indigo-700 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-100">
              🕒 Hora exacta: {textoHora}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 text-left space-y-2.5 text-sm">
            {itemsComprados.length > 0 && (
              <div className="space-y-1 pb-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase block">
                  🍽️ Productos incluidos:
                </span>
                {itemsComprados.map((det, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-700">
                    <span>
                      <strong>{det.cantidad}x</strong> {det.nombre_producto}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${Number(det.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between gap-2">
              <span className="text-gray-500">📍 Dirección:</span>
              <span className="font-semibold text-gray-800 text-right">{direccion}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">{emojiPago} Forma de pago:</span>
              <span className="font-semibold text-gray-800">{formaPago}</span>
            </div>
            {notas && (
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">🔔 Timbre / Notas:</span>
                <span className="font-semibold text-gray-800 text-right">{notas}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-700">💰 Total abonado:</span>
              <span className="font-extrabold text-gray-900 text-base">
                ${Number(totalAbonado ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              🍽️ Seguir mirando
            </button>
            <button
              type="button"
              onClick={() => navigate('/mis-pedidos')}
              className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-md shadow-indigo-200"
            >
              🧾 Ver mis pedidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-sm text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h2>
        <p className="text-gray-600">Agrega productos antes de proceder al checkout.</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Ir al Catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm mt-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Confirmar Pedido</h1>

      {submitError && (
        <div className="p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          ⚠️ {submitError}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field
          name="direccion_entrega"
          validators={{
            onChange: ({ value }) =>
              value.trim().length < 5 || value.trim().length > 200
                ? 'La dirección de entrega debe tener entre 5 y 200 caracteres (RN-06).'
                : undefined,
          }}
        >
          {(field) => {
            const mostrarError =
              (field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
              field.state.meta.errors.length > 0;

            return (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dirección de Entrega *
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="Ej. Av. San Martín 450"
                />
                {mostrarError ? (
                  <p className="text-red-500 text-xs mt-1">
                    {field.state.meta.errors.join(', ')}
                  </p>
                ) : null}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="forma_pago">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700">Forma de Pago *</label>
              <select
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(e.target.value as 'EFECTIVO' | 'TRANSFERENCIA')
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
          )}
        </form.Field>

        <form.Field name="notas">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="Aclaraciones para la entrega..."
              />
            </div>
          )}
        </form.Field>

        <div className="border-t pt-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Total a pagar:</span>
            <p className="text-2xl font-bold text-gray-900">${total().toFixed(2)}</p>
          </div>
          <div className="space-x-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/carrito')}>
              Volver al Carrito
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Confirmando...' : 'Confirmar y Pedir'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};