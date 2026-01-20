'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  Package,
  Users,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CartItem {
  id: string;
  designName: string;
  designData: string;
  apparelType: string;
  sizes: string;
  unitPrice: number;
  sendToTeam: boolean;
  teamMembers: string | null;
  createdAt: string;
}

interface Cart {
  id: string;
  items: CartItem[];
}

export default function CartClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        setCart(await res.json());
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setDeleting(itemId);
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setCart(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : null);
        toast({ title: 'Item Removed', description: 'Item has been removed from your cart.' });
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch('/api/cart?clearAll=true', { method: 'DELETE' });
      if (res.ok) {
        setCart(prev => prev ? { ...prev, items: [] } : null);
        toast({ title: 'Cart Cleared', description: 'All items have been removed.' });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getItemQuantity = (item: CartItem): number => {
    if (item.sendToTeam) {
      const members = item.teamMembers ? JSON.parse(item.teamMembers) : [];
      return members.length;
    }
    const sizes = JSON.parse(item.sizes);
    return Object.values(sizes).reduce((sum: number, qty) => sum + (qty as number), 0);
  };

  const getItemTotal = (item: CartItem): number => {
    return getItemQuantity(item) * item.unitPrice;
  };

  const getCartTotal = (): number => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  const formatSizes = (item: CartItem): string => {
    if (item.sendToTeam) return 'Sizes TBD (Team)';
    const sizes = JSON.parse(item.sizes);
    const entries = Object.entries(sizes).filter(([, qty]) => (qty as number) > 0);
    if (entries.length === 0) return 'No sizes selected';
    return entries.map(([size, qty]) => `${size}: ${qty}`).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" /> Shopping Cart
          </h1>
          <p className="text-gray-600 mt-1">
            {cart?.items.length || 0} item(s) in your cart
          </p>
        </div>
        {cart && cart.items.length > 0 && (
          <Button variant="outline" onClick={clearCart}>
            Clear Cart
          </Button>
        )}
      </div>

      {!cart || cart.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Your cart is empty</h2>
          <p className="text-gray-500 mt-2">Add some designs from the Creator page</p>
          <Button className="mt-6" onClick={() => router.push('/creator')}>
            Go to Creator
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {cart.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{item.designName}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{item.apparelType}</Badge>
                          {item.sendToTeam && (
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" /> Team Order
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={deleting === item.id}
                      >
                        {deleting === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{formatSizes(item)}</p>
                    {item.sendToTeam && item.teamMembers && (
                      <p className="text-sm text-gray-500">
                        {JSON.parse(item.teamMembers).length} team members
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-600">
                        ${item.unitPrice.toFixed(2)} x {getItemQuantity(item)}
                      </span>
                      <span className="font-semibold">
                        ${getItemTotal(item).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Subtotal</span>
            <span className="text-2xl font-bold">${getCartTotal().toFixed(2)}</span>
          </div>

          <Button
            className="w-full mt-4"
            size="lg"
            onClick={() => router.push('/checkout')}
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
