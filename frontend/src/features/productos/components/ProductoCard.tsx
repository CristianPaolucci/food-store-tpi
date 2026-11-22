import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';

export interface ProductoCardData {
  id?: number;
  producto_id?: number;
  nombre?: string;
  titulo?: string;
  descripcion?: string;
  description?: string;
  precio?: number | string;
  precio_base?: number | string;
  precio_unitario?: number | string;
  stock?: number | string;
  cantidad?: number;
  imagen_url?: string;
  imagen?: string;
  [key: string]: unknown;
}

interface ProductoCardProps {
  producto: ProductoCardData;
}

export const ProductoCard: React.FC<ProductoCardProps> = ({ producto }) => {
  const navigate = useNavigate();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddedModalOpen, setIsAddedModalOpen] = useState(false);

  const usuario = useAuthStore((state) => state.usuario);
  const agregarItem = useCartStore((state) => state.agregarItem);

  const isAdmin = (usuario as any)?.role === 'admin';

  const nombreProducto = producto.nombre || producto.titulo || 'Producto';
  const imagenProducto = producto.imagen_url || producto.imagen || '';

  const obtenerPrecio = (p: ProductoCardData): number => {
    const candidatoDirecto =
      p.precio_unitario ??
      p.precio_base ??
      p.precio ??
      p['precioUnitario'] ??
      p['precio_venta'] ??
      p['precioVenta'] ??
      p['price'] ??
      p['unitPrice'] ??
      p['valor'] ??
      p['monto'] ??
      p['costo'];

    if (
      candidatoDirecto !== undefined &&
      candidatoDirecto !== null &&
      !Number.isNaN(Number(candidatoDirecto))
    ) {
      return Number(candidatoDirecto);
    }

    for (const key of Object.keys(p)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('precio') ||
        lowerKey.includes('price') ||
        lowerKey.includes('valor') ||
        lowerKey.includes('monto') ||
        lowerKey.includes('costo')
      ) {
        const val = Number(p[key]);
        if (!Number.isNaN(val)) return val;
      }
    }
    return 0;
  };

  const obtenerStock = (p: ProductoCardData): number | null => {
    const candidatoStock =
      p.stock ??
      p.cantidad ??
      p['cantidad_disponible'] ??
      p['stock_disponible'] ??
      p['unidades'] ??
      p['disponible'];

    if (
      candidatoStock !== undefined &&
      candidatoStock !== null &&
      typeof candidatoStock !== 'boolean' &&
      !Number.isNaN(Number(candidatoStock))
    ) {
      return Math.max(0, Number(candidatoStock));
    }

    return null;
  };

  const precioProducto = obtenerPrecio(producto);
  const stockProducto = obtenerStock(producto);
  const sinStock = stockProducto !== null && stockProducto <= 0;

  const handleAgregar = () => {
    if (isAdmin) {
      return;
    }

    if (!usuario) {
      setIsAuthModalOpen(true);
      return;
    }

    if (sinStock) {
      return;
    }

    const cantidadNormalizada =
      producto.cantidad !== undefined && !Number.isNaN(Number(producto.cantidad))
        ? Number(producto.cantidad)
        : undefined;

    agregarItem({
      ...producto,
      ...(cantidadNormalizada !== undefined ? { cantidad: cantidadNormalizada } : {}),
      precio_unitario: precioProducto,
    });

    setIsAddedModalOpen(true);
  };

  const obtenerEmoji = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('pizza')) return '🍕';
    if (n.includes('burger') || n.includes('hamburguesa')) return '🍔';
    if (n.includes('coca') || n.includes('gaseosa') || n.includes('lata')) return '🥤';
    if (n.includes('cerveza') || n.includes('birra')) return '🍺';
    if (n.includes('limonada') || n.includes('agua')) return '🍹';
    if (
      n.includes('cheesecake') ||
      n.includes('tiramisú') ||
      n.includes('brownie') ||
      n.includes('volcán') ||
      n.includes('chocolate')
    ) {
      return '🍰';
    }
    return '🍽️';
  };

  const emojiProducto = obtenerEmoji(nombreProducto);

  const obtenerDescripcion = (p: ProductoCardData, nombre: string) => {
    const n = nombre.toLowerCase();

    if (n.includes('bacon')) {
      return 'Doble medallón de carne vacuno seleccionado, abundante bacon crujiente, queso cheddar fundido, lechuga fresca, tomate natural en rodajas y aderezo especial en pan brioche artesanal. ¡Incluye porción de papas fritas doradas y crujientes!';
    }
    if (n.includes('veggie')) {
      return 'Delicioso medallón artesanal a base de lentejas y vegetales frescos de estación, acompañado de rodajas de palta cremosa, lechuga crocante, tomate natural en rodajas, cebolla morada y aderezo suave de hierbas en pan de campo integral tostado.';
    }
    if (n.includes('cheeseburger') || n.includes('classic')) {
      return 'Jugoso medallón de carne vacuna de selección, clásico queso cheddar fundido, pepinillos crujientes, cebolla en cubitos y salsa especial de la casa en pan brioche suave y tostado.';
    }
    if (n.includes('muzzarella')) {
      return 'Clásica y tradicional pizza elaborada con masa madre de fermentación lenta, generosa capa de queso muzarella fundido, salsa de tomates naturales de la huerta y un toque de orégano.';
    }
    if (n.includes('especial')) {
      return 'Exuberante pizza con base de muzarella fundida, abundante jamón cocido seleccionado, morrones asados en tiritas, rodajas de tomate fresco y aceitunas sobre masa crujiente horneada a la piedra.';
    }
    if (n.includes('napolitana')) {
      return 'Deliciosa pizza artesanal con muzarella, finas rodajas de tomates frescos sazonados con ajo confitado, hojas de albahaca fresca recién cortada y un hilo de aceite de oliva virgen extra.';
    }
    if (n.includes('cerveza') || n.includes('birra')) {
      return 'Cerveza artesanal rubia tirada de 500ml, estilo Golden Ale, refrescante, con cuerpo equilibrado, notas de malta suave y una espuma cremosa ideal.';
    }
    if (n.includes('limonada')) {
      return 'Refrescante limonada natural casera de 500ml elaborada con limones frescos exprimidos del día, hojas de menta orgánica, jengibre rallado y un toque justo de almíbar.';
    }
    if (n.includes('coca') || n.includes('gaseosa')) {
      return 'Gaseosa clásica y refrescante en lata fría de 354ml, ideal para acompañar cualquier plato y disfrutar bien fría.';
    }
    if (n.includes('agua')) {
      return 'Agua mineral pura y liviana sin gas en presentación de 500ml, ideal para una hidratación fresca y natural durante tu comida.';
    }
    if (n.includes('cheesecake')) {
      return 'Suave y cremoso pastel de queso estilo New York sobre una base crocante de galletas, cubierto con una exquisita reducción artesanal de frutos rojos frescos (arándanos y frutillas).';
    }
    if (n.includes('volcán')) {
      return 'Esponjoso bizcocho tibio de chocolate amargo con un corazón fundido de chocolate que se deshace al primer corte. ¡Un manjar imperdible para los amantes del cacao!';
    }
    if (n.includes('tiramisú')) {
      return 'Clásico postre italiano elaborado con capas de vainillas caseras humedecidas en café espresso, fina crema de mascarpone batida a la perfección y espolvoreado con cacao amargo de primera calidad.';
    }
    if (n.includes('brownie')) {
      return 'Húmedo e intenso brownie de chocolate con nueces tostadas, servido con una bocha de helado de americana artesanal y finos hilos de chocolate fundido por encima.';
    }

    const descBackend = p.descripcion || p.description;
    if (
      typeof descBackend === 'string' &&
      descBackend.length > 20 &&
      !descBackend.toLowerCase().includes('rubia tirada en botella')
    ) {
      return descBackend;
    }

    return `Exquisito plato de ${nombre} elaborado con ingredientes frescos de la más alta calidad, preparado en el momento para garantizar el mejor sabor y una experiencia única. ¡Ideal para disfrutar solo o acompañado!`;
  };

  const descripcionProducto = obtenerDescripcion(producto, nombreProducto);

  const renderStockBadge = () => {
    if (stockProducto === null) return null;

    if (sinStock) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
          <span>⛔</span>
          <span>Sin stock</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span>📦</span>
        <span>Disponibles: {stockProducto}</span>
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
        <div className="relative cursor-pointer" onClick={() => setIsDetailModalOpen(true)}>
          <img
            src={imagenProducto}
            alt={nombreProducto}
            className="h-40 w-full object-cover"
          />
          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs shadow-sm">
            {emojiProducto}
          </span>
        </div>

        <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
          <div className="space-y-1.5">
            <h3
              onClick={() => setIsDetailModalOpen(true)}
              className="font-semibold text-gray-900 text-base cursor-pointer hover:text-indigo-600 transition-colors line-clamp-1"
            >
              {nombreProducto}
            </h3>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-700">${precioProducto}</p>
              {renderStockBadge()}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(true)}
              className="w-full bg-gray-100 text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-200 transition-colors text-xs font-semibold flex items-center justify-center space-x-1"
            >
              <span>ℹ️</span>
              <span>Ver detalle</span>
            </button>

            {isAdmin ? (
              <button
                type="button"
                disabled
                className="w-full py-2 px-3 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 cursor-not-allowed"
              >
                👑 Vista administrador
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAgregar}
                disabled={sinStock}
                className={`w-full py-2 px-3 rounded-md transition-colors text-sm font-medium shadow-sm ${
                  sinStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {sinStock ? 'Sin stock' : 'Agregar al carrito'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE PRODUCTO AGREGADO AL CARRITO */}
      {isAddedModalOpen && !isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-4xl shadow-sm">
              🛒
            </div>
            <div className="space-y-1.5">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✅ Agregado al carrito
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                ¡Producto agregado al carrito! {emojiProducto}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sumaste <strong>{nombreProducto}</strong> (${precioProducto}) a tu pedido.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddedModalOpen(false);
                  navigate('/');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                🍽️ Seguir mirando
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddedModalOpen(false);
                  navigate('/carrito');
                }}
                className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-md shadow-indigo-200"
              >
                🛍️ Ir al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DEL PRODUCTO */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all">
            <div className="relative">
              <img
                src={imagenProducto}
                alt={nombreProducto}
                className="h-56 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
              <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold shadow-md">
                {emojiProducto} {nombreProducto}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    Detalle del Plato
                  </span>
                  {renderStockBadge()}
                </div>
                <span className="text-2xl font-extrabold text-gray-900">${precioProducto}</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Descripción:</h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  {descripcionProducto}
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cerrar
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 cursor-not-allowed"
                  >
                    👑 Vista administrador
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (sinStock) return;
                      setIsDetailModalOpen(false);
                      handleAgregar();
                    }}
                    disabled={sinStock}
                    className={`flex-1 py-2.5 px-4 rounded-xl transition-colors text-sm font-medium ${
                      sinStock
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                    }`}
                  >
                    {sinStock ? '⛔ Sin stock' : '🛒 Agregar al carrito'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA INICIAR SESIÓN ANTES DE AGREGAR AL CARRITO */}
      {isAuthModalOpen && !isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-3xl">
              🔐
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">
                ¡Iniciá sesión para armar tu pedido! 🛒
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tenés que iniciar sesión primero para agregar <strong>{nombreProducto}</strong>{' '}
                {emojiProducto} a tu carrito.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Seguir mirando
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  navigate('/login');
                }}
                className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-md shadow-indigo-200"
              >
                🚀 Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};