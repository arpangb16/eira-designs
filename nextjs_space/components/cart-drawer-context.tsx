'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

const CART_OPEN_EVENT = 'eira-open-cart';

type CartDrawerContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openCart: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextType | null>(null);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openCart = useCallback(() => setOpen(true), []);

  // Open cart when URL has ?cart=open (test by visiting e.g. /dashboard?cart=open)
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cart') === 'open') {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(CART_OPEN_EVENT, handler);
    return () => window.removeEventListener(CART_OPEN_EVENT, handler);
  }, []);

  return (
    <CartDrawerContext.Provider value={{ open, setOpen, openCart }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  const openCart = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CART_OPEN_EVENT));
    }
    ctx?.setOpen(true);
  }, [ctx]);
  if (!ctx) {
    return {
      open: false,
      setOpen: () => {},
      openCart,
    };
  }
  return { ...ctx, openCart };
}
