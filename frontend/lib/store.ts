import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, User } from './api';

// ── Cart Store ──
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  subtotal: () => number;
  vat: () => number;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return { items: s.items.map((i) => i.productId === item.productId ? { ...i, qty: i.qty + item.qty } : i) };
          }
          return { items: [...s.items, item] };
        }),

      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      updateQty: (productId, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.productId !== productId)
            : s.items.map((i) => i.productId === productId ? { ...i, qty } : i),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      vat: () => Math.round(get().subtotal() * 0.07 * 100) / 100,
      total: () => Math.round((get().subtotal() + get().vat()) * 100) / 100,
      itemCount: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: 'kraft-cart' },
  ),
);

// ── Auth Store ──
interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('kraft_token', token);
        set({ user, token });
      },

      clearAuth: () => {
        localStorage.removeItem('kraft_token');
        set({ user: null, token: null });
      },

      isAdmin: () => get().user?.role === 'admin',
      isStaff: () => ['admin', 'staff'].includes(get().user?.role ?? ''),
    }),
    { name: 'kraft-auth', partialize: (s) => ({ user: s.user, token: s.token }) },
  ),
);
