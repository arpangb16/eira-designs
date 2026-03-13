'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Loader2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCartDrawer } from '@/components/cart-drawer-context';
import { createPortal } from 'react-dom';

interface CartItemType {
  id: string;
  designName: string;
  designData: string;
  apparelType: string;
  creatorDesign?: { previewImage?: string | null } | null;
}

interface CartType {
  id: string;
  items: CartItemType[];
}

export function CartDrawer() {
  const { data: session } = useSession();
  const { open, setOpen } = useCartDrawer();
  const [cart, setCart] = useState<CartType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && session?.user) {
      setLoading(true);
      fetch('/api/cart')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setCart(data);
          setLoading(false);
        })
        .catch(() => {
          setCart(null);
          setLoading(false);
        });
    } else {
      setCart(null);
    }
  }, [open, session?.user]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [open, setOpen]);

  if (!open) return null;

  const content = (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/60"
        aria-hidden
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md flex flex-col bg-background shadow-2xl border-l"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : cart?.items && cart.items.length > 0 ? (
          <>
            <ScrollArea className="flex-1 px-4 py-2">
              <ul className="space-y-3 py-2">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex gap-3 rounded-lg border p-2">
                    <div className="w-14 h-14 flex-shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {item.creatorDesign?.previewImage ? (
                        <img
                          src={item.creatorDesign.previewImage}
                          alt={item.designName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.designName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.apparelType}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <div className="border-t p-4 flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/cart" onClick={() => setOpen(false)}>
                  View cart
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/checkout" onClick={() => setOpen(false)}>
                  Checkout
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <Button asChild className="mt-4">
              <Link href="/creator" onClick={() => setOpen(false)}>
                Go to Creator
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
