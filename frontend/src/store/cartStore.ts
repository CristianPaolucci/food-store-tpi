import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  imagen_url: string;
}

export interface CartProductInput {
  id?: number;
  producto_id?: number;
  nombre?: string;
  titulo?: string;
  precio?: number | string;
  precio_base?: number | string;
  precio_unitario?: number | string;
  cantidad?: number;
  imagen_url?: string;
  imagen?: string;
}

interface CartState {
  items: CartItem[];
  agregarItem: (product: CartProductInput) => void;
  agregarAlCarrito: (product: CartProductInput) => void;
  removerItem: (producto_id: number) => void;
  quitar: (producto_id: number) => void;
  cambiarCantidad: (producto_id: number, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
}

const buildCartItem = (product: CartProductInput): CartItem => {
  const producto_id = Number(product.producto_id ?? product.id ?? 0);
  const nombre = product.nombre ?? product.titulo ?? 'Producto';
  const rawPrecio = product.precio_unitario ?? product.precio_base ?? product.precio ?? 0;
  const precio_unitario = Number(rawPrecio) || 0;
  const cantidad = Math.max(1, Number(product.cantidad ?? 1) || 1);
  const imagen_url = product.imagen_url ?? product.imagen ?? '';

  return {
    producto_id,
    nombre,
    precio_unitario,
    cantidad,
    imagen_url,
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregarItem: (product) =>
        set((state) => {
          const nuevo = buildCartItem(product);
          const existing = state.items.find((i) => i.producto_id === nuevo.producto_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.producto_id === nuevo.producto_id
                  ? { ...i, cantidad: i.cantidad + nuevo.cantidad }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, nuevo],
          };
        }),

      agregarAlCarrito: (product) => get().agregarItem(product),

      removerItem: (producto_id) =>
        set((state) => ({
          items: state.items.filter((i) => i.producto_id !== producto_id),
        })),

      quitar: (producto_id) => get().removerItem(producto_id),

      cambiarCantidad: (producto_id, cantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.producto_id === producto_id
              ? { ...i, cantidad: Math.max(1, cantidad) }
              : i
          ),
        })),

      vaciar: () => set({ items: [] }),

      total: () =>
        get().items.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0),
    }),
    {
      name: 'foodstore-cart-storage',
    }
  )
);