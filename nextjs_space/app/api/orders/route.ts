import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// GET - List user's orders
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { address: true } },
        addresses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('[ORDERS] Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, addresses, shippingMethod, shippingType, itemAddressMap } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    if (!addresses || !addresses.length) {
      return NextResponse.json({ error: 'No shipping address provided' }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map((item: {
      designName: string;
      designData: object;
      apparelType: string;
      sizes: Record<string, number>;
      unitPrice: number;
      sendToTeam: boolean;
      teamMembers?: object[];
    }) => {
      const sizes = item.sizes;
      const quantity = Object.values(sizes).reduce((sum: number, qty) => sum + (qty as number), 0);
      const totalPrice = quantity * (item.unitPrice || 25);
      subtotal += totalPrice;
      return {
        ...item,
        quantity,
        totalPrice,
      };
    });

    const shippingCost = shippingMethod === 'expedite' ? 20 : 0;
    const total = subtotal + shippingCost;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.user.id,
          subtotal,
          shippingCost,
          total,
          shippingMethod: shippingMethod || 'free',
          shippingType: shippingType || 'single',
        },
      });

      // Create addresses
      const addressMap: Record<number, string> = {};
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        const orderAddress = await tx.orderAddress.create({
          data: {
            orderId: newOrder.id,
            name: addr.name,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country || 'USA',
            phone: addr.phone || null,
            isDefault: i === 0,
          },
        });
        addressMap[i] = orderAddress.id;
      }

      // Create order items
      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];
        let addressId = addressMap[0]; // Default to first address
        
        if (shippingType === 'multiple' && itemAddressMap && itemAddressMap[i] !== undefined) {
          addressId = addressMap[itemAddressMap[i]] || addressMap[0];
        }

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            designName: item.designName,
            designData: JSON.stringify(item.designData),
            apparelType: item.apparelType || 'tshirt',
            sizes: JSON.stringify(item.sizes),
            unitPrice: item.unitPrice || 25,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            sendToTeam: item.sendToTeam || false,
            teamMembers: item.teamMembers ? JSON.stringify(item.teamMembers) : null,
            addressId,
          },
        });
      }

      // Clear user's cart
      const cart = await tx.cart.findUnique({ where: { userId: session.user.id } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return newOrder;
    });

    // Fetch complete order
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { address: true } },
        addresses: true,
      },
    });

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error('[ORDERS] Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
