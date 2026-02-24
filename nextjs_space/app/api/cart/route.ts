import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Get user's cart
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { creatorDesign: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create cart if doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: { include: { creatorDesign: true } } },
      });
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error('[CART] Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorDesignId, designName, designData, apparelType, sizes, unitPrice, sendToTeam, teamMembers } = body;

    if (!designName || !designData || !sizes) {
      return NextResponse.json({ error: 'Design name, data, and sizes are required' }, { status: 400 });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: session.user.id } });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        creatorDesignId: creatorDesignId || null,
        designName,
        designData: JSON.stringify(designData),
        apparelType: apparelType || 'tshirt',
        sizes: JSON.stringify(sizes),
        unitPrice: unitPrice || 25.00,
        sendToTeam: sendToTeam || false,
        teamMembers: teamMembers ? JSON.stringify(teamMembers) : null,
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error('[CART] Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

// DELETE - Remove item from cart or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clearAll');

    const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (clearAll === 'true') {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      return NextResponse.json({ message: 'Cart cleared' });
    }

    if (itemId) {
      await prisma.cartItem.delete({ where: { id: itemId, cartId: cart.id } });
      return NextResponse.json({ message: 'Item removed' });
    }

    return NextResponse.json({ error: 'Item ID or clearAll required' }, { status: 400 });
  } catch (error) {
    console.error('[CART] Error removing from cart:', error);
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
  }
}

// PATCH - Update cart item
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, sizes, sendToTeam, teamMembers } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (sizes) updateData.sizes = JSON.stringify(sizes);
    if (sendToTeam !== undefined) updateData.sendToTeam = sendToTeam;
    if (teamMembers !== undefined) updateData.teamMembers = teamMembers ? JSON.stringify(teamMembers) : null;

    const cartItem = await prisma.cartItem.update({
      where: { id: itemId, cartId: cart.id },
      data: updateData,
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error('[CART] Error updating cart item:', error);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}
