'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  MapPin,
  Loader2,
} from 'lucide-react';

interface OrderAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderItem {
  id: string;
  designName: string;
  apparelType: string;
  sizes: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sendToTeam: boolean;
  teamMembers: string | null;
  address: OrderAddress | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: string;
  shippingType: string;
  items: OrderItem[];
  addresses: OrderAddress[];
  createdAt: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  processing: { icon: Package, color: 'text-blue-500', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-500', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-500', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-500', label: 'Cancelled' },
};

export default function OrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSizes = (sizesJson: string): string => {
    const sizes = JSON.parse(sizesJson);
    const entries = Object.entries(sizes).filter(([, qty]) => (qty as number) > 0);
    if (entries.length === 0) return 'Sizes TBD';
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
            <ShoppingBag className="h-8 w-8" /> Order History
          </h1>
          <p className="text-gray-600 mt-1">
            {orders.length} order(s)
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/creator')}>
          Create New Design
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">No orders yet</h2>
          <p className="text-gray-500 mt-2">Create a design and place your first order</p>
          <Button className="mt-6" onClick={() => router.push('/creator')}>
            Go to Creator
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const isExpanded = expandedOrders.has(order.id);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleOrder(order.id)}>
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full bg-gray-100 ${status.color}`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{order.orderNumber}</h3>
                              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {status.label}
                            </Badge>
                            <span className="font-semibold">${order.total.toFixed(2)}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <Separator />
                      <div className="p-4 bg-gray-50">
                        {/* Items */}
                        <h4 className="font-medium mb-3">Items ({order.items.length})</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between p-3 bg-white rounded-lg border"
                            >
                              <div>
                                <p className="font-medium">{item.designName}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline">{item.apparelType}</Badge>
                                  {item.sendToTeam && <Badge variant="secondary">Team Order</Badge>}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {formatSizes(item.sizes)} • Qty: {item.quantity}
                                </p>
                                {item.address && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.address.city}, {item.address.state}
                                  </p>
                                )}
                              </div>
                              <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <Separator className="my-4" />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Shipping ({order.shippingMethod === 'expedite' ? 'Expedite' : 'Standard'})
                            </span>
                            <span>{order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : 'FREE'}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-base pt-2">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Shipping Addresses */}
                        {order.addresses.length > 0 && (
                          <>
                            <Separator className="my-4" />
                            <h4 className="font-medium mb-2">Shipping Address{order.addresses.length > 1 ? 'es' : ''}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {order.addresses.map((addr) => (
                                <div key={addr.id} className="p-3 bg-white rounded-lg border text-sm">
                                  <p className="font-medium">{addr.name}</p>
                                  <p className="text-gray-600">{addr.street}</p>
                                  <p className="text-gray-600">
                                    {addr.city}, {addr.state} {addr.zipCode}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
