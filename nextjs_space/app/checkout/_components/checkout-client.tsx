'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Truck,
  Zap,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  Package,
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
}

interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

const emptyAddress: Address = {
  name: '', street: '', city: '', state: '', zipCode: '', country: 'USA', phone: '',
};

export default function CheckoutClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('free');
  const [shippingType, setShippingType] = useState('single');
  const [addresses, setAddresses] = useState<Address[]>([{ ...emptyAddress }]);
  const [itemAddressMap, setItemAddressMap] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const cart = await res.json();
        setCartItems(cart.items || []);
        // Initialize item-address map
        const map: Record<number, number> = {};
        cart.items?.forEach((_: CartItem, i: number) => { map[i] = 0; });
        setItemAddressMap(map);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
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

  const getSubtotal = (): number => {
    return cartItems.reduce((sum, item) => sum + getItemQuantity(item) * item.unitPrice, 0);
  };

  const getShippingCost = (): number => {
    return shippingMethod === 'expedite' ? 20 : 0;
  };

  const getTotal = (): number => {
    return getSubtotal() + getShippingCost();
  };

  const addAddress = () => {
    setAddresses(prev => [...prev, { ...emptyAddress }]);
  };

  const removeAddress = (index: number) => {
    if (addresses.length <= 1) return;
    setAddresses(prev => prev.filter((_, i) => i !== index));
    // Update item-address map
    setItemAddressMap(prev => {
      const newMap: Record<number, number> = {};
      Object.entries(prev).forEach(([itemIndex, addrIndex]) => {
        if (addrIndex === index) {
          newMap[parseInt(itemIndex)] = 0;
        } else if (addrIndex > index) {
          newMap[parseInt(itemIndex)] = addrIndex - 1;
        } else {
          newMap[parseInt(itemIndex)] = addrIndex;
        }
      });
      return newMap;
    });
  };

  const updateAddress = (index: number, field: keyof Address, value: string) => {
    setAddresses(prev => prev.map((addr, i) => i === index ? { ...addr, [field]: value } : addr));
  };

  const validateAddresses = (): boolean => {
    for (const addr of addresses) {
      if (!addr.name || !addr.street || !addr.city || !addr.state || !addr.zipCode) {
        return false;
      }
    }
    return true;
  };

  const placeOrder = async () => {
    if (!validateAddresses()) {
      toast({ title: 'Error', description: 'Please fill in all address fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cartItems.map(item => ({
        designName: item.designName,
        designData: JSON.parse(item.designData),
        apparelType: item.apparelType,
        sizes: JSON.parse(item.sizes),
        unitPrice: item.unitPrice,
        sendToTeam: item.sendToTeam,
        teamMembers: item.teamMembers ? JSON.parse(item.teamMembers) : null,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          addresses,
          shippingMethod,
          shippingType,
          itemAddressMap: shippingType === 'multiple' ? itemAddressMap : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to place order');

      const order = await res.json();
      toast({ title: 'Order Placed!', description: `Order ${order.orderNumber} has been placed successfully.` });
      router.push('/orders');
    } catch (error) {
      console.error('Order error:', error);
      toast({ title: 'Error', description: 'Failed to place order', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold">No items to checkout</h2>
          <Button className="mt-4" onClick={() => router.push('/creator')}>Go to Creator</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Method */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Method</h2>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
              <div className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Truck className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Standard Shipping</p>
                    <p className="text-sm text-gray-500">5-7 business days</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">FREE</Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 mt-2">
                <RadioGroupItem value="expedite" id="expedite" />
                <Label htmlFor="expedite" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Expedite Shipping</p>
                    <p className="text-sm text-gray-500">2-3 business days</p>
                  </div>
                  <Badge className="ml-auto">$20.00</Badge>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Shipping Type */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
            <RadioGroup value={shippingType} onValueChange={setShippingType}>
              <div className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex items-center gap-3 cursor-pointer">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Ship to One Address</p>
                    <p className="text-sm text-gray-500">All items ship together</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 mt-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple" className="flex items-center gap-3 cursor-pointer">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Ship to Multiple Addresses</p>
                    <p className="text-sm text-gray-500">Select address for each item</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Addresses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Shipping Address{addresses.length > 1 ? 'es' : ''}</h2>
              {shippingType === 'multiple' && (
                <Button variant="outline" size="sm" onClick={addAddress}>
                  <Plus className="h-4 w-4 mr-1" /> Add Address
                </Button>
              )}
            </div>
            <div className="space-y-6">
              {addresses.map((addr, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Address {index + 1}</h3>
                    {addresses.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeAddress(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input value={addr.name} onChange={(e) => updateAddress(index, 'name', e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="col-span-2">
                      <Label>Street Address *</Label>
                      <Input value={addr.street} onChange={(e) => updateAddress(index, 'street', e.target.value)} placeholder="123 Main St" />
                    </div>
                    <div>
                      <Label>City *</Label>
                      <Input value={addr.city} onChange={(e) => updateAddress(index, 'city', e.target.value)} placeholder="New York" />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Input value={addr.state} onChange={(e) => updateAddress(index, 'state', e.target.value)} placeholder="NY" />
                    </div>
                    <div>
                      <Label>ZIP Code *</Label>
                      <Input value={addr.zipCode} onChange={(e) => updateAddress(index, 'zipCode', e.target.value)} placeholder="10001" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={addr.phone} onChange={(e) => updateAddress(index, 'phone', e.target.value)} placeholder="(555) 123-4567" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Item-Address Assignment (for multiple addresses) */}
          {shippingType === 'multiple' && addresses.length > 1 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Assign Items to Addresses</h2>
              <div className="space-y-3">
                {cartItems.map((item, itemIndex) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{item.designName}</span>
                    <Select
                      value={String(itemAddressMap[itemIndex] || 0)}
                      onValueChange={(v) => setItemAddressMap(prev => ({ ...prev, [itemIndex]: parseInt(v) }))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((addr, addrIndex) => (
                          <SelectItem key={addrIndex} value={String(addrIndex)}>
                            {addr.name || `Address ${addrIndex + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.designName} (x{getItemQuantity(item)})</span>
                  <span>${(getItemQuantity(item) * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingMethod === 'free' ? 'FREE' : '$20.00'}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={placeOrder}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Place Order</>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
