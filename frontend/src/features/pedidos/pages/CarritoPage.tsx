import { useState } from 'react';
import { useCartStore } from '../../../store/cartStore';
import { Button } from '../../../shared/ui/Button';
import { useNavigate } from 'react-router-dom';

interface ItemParaQuitar {
  producto_id: number;
  nombre: string;
  cantidad: number;
  subtotal: number;
}

export const CarritoPage = () => {
  const { items, quitar, cambiarCantidad, vaciar, total } = useCartStore();
  const navigate = useNavigate();
  const [itemPendienteQuitar, setItemPendienteQuitar] = useState<ItemParaQuitar | null>(null);

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-12 rounded-xl text-center space-y-4 shadow-md max-w-2xl mx-auto mt-8">
        <div className="text-4xl">🛒</div>
        <h2 className="text-2xl font-extrabold text-gray-900">Tu carrito está vacío</h2>
        <p className="text-gray-600">
          Explora nuestro catálogo y agrega platos deliciosos a tu pedido.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          🍽️ Ir al Catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900">🛒 Carrito de Compras</h1>
        <Button variant="secondary" onClick={vaciar}>
          Vaciar Carrito
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden divide-y divide-gray-200">
        {items.map((item) => {
          const subtotalItem = item.precio_unitario * item.cantidad;

          return (
            <div
              key={item.producto_id}
              className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex-1 text-center sm:text-left space-y-0.5">
                <h3 className="text-lg font-bold text-gray-900">{item.nombre}</h3>
                <p className="text-sm text-gray-500">
                  Precio unitario: ${item.precio_unitario.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2.5">
                {item.cantidad > 1 && (
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                    className="bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                    title="Restar una unidad"
                  >
                    ➖ Restar 1
                  </button>
                )}

                <label htmlFor={`cantidad-${item.producto_id}`} className="sr-only">
                  Cantidad
                </label>
                <input
                  id={`cantidad-${item.producto_id}`}
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(e) =>
                    cambiarCantidad(item.producto_id, parseInt(e.target.value, 10) || 1)
                  }
                  className="w-16 border border-gray-300 rounded-lg text-center py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <span className="text-base font-extrabold text-gray-900 w-24 text-right">
                  ${subtotalItem.toFixed(2)}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setItemPendienteQuitar({
                      producto_id: item.producto_id,
                      nombre: item.nombre,
                      cantidad: item.cantidad,
                      subtotal: subtotalItem,
                    })
                  }
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  {item.cantidad > 1 ? '🗑️ Quitar todo' : '🗑️ Eliminar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-sm text-gray-500">Total General:</span>
          <h2 className="text-3xl font-extrabold text-gray-900">${total().toFixed(2)}</h2>
        </div>

        <Button variant="primary" onClick={() => navigate('/checkout')}>
          Continuar al Checkout
        </Button>
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA QUITAR PRODUCTO DEL CARRITO */}
      {itemPendienteQuitar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 p-6 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-4xl shadow-xs">
              🗑️
            </div>
            <div className="space-y-1.5">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                Quitar del carrito
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                ¿Quitar {itemPendienteQuitar.nombre}? 🛒
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {itemPendienteQuitar.cantidad > 1 ? (
                  <>
                    Se quitarán las <strong>{itemPendienteQuitar.cantidad} unidades</strong> (
                    <strong>${itemPendienteQuitar.subtotal.toFixed(2)}</strong>) de este producto. Si
                    solo querés bajar en 1 unidad, podés usar <strong>➖ Restar 1</strong>.
                  </>
                ) : (
                  <>
                    Se eliminará <strong>1 unidad</strong> de{' '}
                    <strong>{itemPendienteQuitar.nombre}</strong> (
                    <strong>${itemPendienteQuitar.subtotal.toFixed(2)}</strong>) de tu carrito.
                  </>
                )}
              </p>
            </div>
            <div className="pt-1 flex gap-3">
              <button
                type="button"
                onClick={() => setItemPendienteQuitar(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
              >
                Mantener
              </button>
              <button
                type="button"
                onClick={() => {
                  quitar(itemPendienteQuitar.producto_id);
                  setItemPendienteQuitar(null);
                }}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold shadow-md shadow-red-200"
              >
                🗑️ Sí, quitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};