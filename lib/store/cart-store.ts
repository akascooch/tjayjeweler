"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartTotals, type CartLine } from "@/lib/cart";

export const CART_STORAGE_KEY = "tjay-cart";
export const LEGACY_BAG_KEY = "tjay-bag";

export type CartItem = {
  variantId: string;
  productSlug: string;
  title: string;
  sku: string;
  unitPriceIrt: number;
  quantity: number;
  imageUrl: string | null;
  ringSize: string | null;
  chainLength: string | null;
  stockQuantity: number;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  hasSku: (sku: string) => boolean;
  totals: () => ReturnType<typeof cartTotals>;
};

function clampQuantity(quantity: number, stockQuantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) return 1;
  if (!Number.isInteger(stockQuantity) || stockQuantity < 1) return 1;
  return Math.min(quantity, stockQuantity);
}

function clearLegacyBag() {
  try {
    localStorage.removeItem(LEGACY_BAG_KEY);
  } catch {
    // Ignore private-mode / SSR storage failures.
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setOpen: (open) => set({ open }),
      toggleOpen: () => set((state) => ({ open: !state.open })),
      addItem: (item) => {
        const quantity = clampQuantity(item.quantity ?? 1, item.stockQuantity);
        set((state) => {
          const existing = state.items.find((entry) => entry.variantId === item.variantId);
          if (!existing) {
            return {
              items: [...state.items, { ...item, quantity }],
              open: true,
            };
          }
          return {
            items: state.items.map((entry) =>
              entry.variantId === item.variantId
                ? {
                    ...entry,
                    ...item,
                    quantity: clampQuantity(entry.quantity + quantity, item.stockQuantity),
                  }
                : entry,
            ),
            open: true,
          };
        });
        clearLegacyBag();
      },
      removeItem: (variantId) => {
        set((state) => ({ items: state.items.filter((item) => item.variantId !== variantId) }));
      },
      setQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.variantId === variantId
                ? { ...item, quantity: clampQuantity(quantity, item.stockQuantity) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },
      clear: () => set({ items: [] }),
      hasSku: (sku) => get().items.some((item) => item.sku === sku),
      totals: () => {
        const lines: CartLine[] = get().items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPriceIrt: item.unitPriceIrt,
        }));
        return cartTotals(lines);
      },
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        clearLegacyBag();
        state?.setHydrated(true);
      },
    },
  ),
);
