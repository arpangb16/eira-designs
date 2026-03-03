import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/creator/designs
 * Returns current user's saved Creator designs (products).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve user id: prefer session.user.id, fall back to lookup by email
    let userId = (session.user as any).id as string | undefined;
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = user?.id;
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure a User row exists for this id (important for BYPASS_AUTH/dev)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: (session.user.email as string | null) ?? null,
        name: session.user.name || 'Creator User',
        role: 'USER',
      },
    });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const design = await prisma.creatorDesign.findFirst({
        where: { id, userId },
      });
      if (!design) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ design });
    } else {
      const designs = await prisma.creatorDesign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          apparelType: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ designs });
    }
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Failed to list designs:', error);
    return NextResponse.json(
      { error: 'Failed to list designs' },
      { status: 500 }
    );
  }
}

/**
 * Save a Creator design as a "product" (CreatorDesign).
 *
 * POST /api/creator/designs
 * body: { name: string; designData: any; apparelType?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, designData, apparelType } = await req.json();

    if (!name || !designData) {
      return NextResponse.json(
        { error: 'name and designData are required' },
        { status: 400 }
      );
    }

    // Resolve user id: prefer session.user.id, fall back to lookup by email
    let userId = (session.user as any).id as string | undefined;
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = user?.id;
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure a User row exists for this id (important for BYPASS_AUTH/dev)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: (session.user.email as string | null) ?? null,
        name: session.user.name || 'Creator User',
        role: 'USER',
      },
    });

    const created = await prisma.creatorDesign.create({
      data: {
        name,
        userId,
        designData: typeof designData === 'string' ? designData : JSON.stringify(designData),
        apparelType: apparelType || 'tshirt',
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Failed to save design:', error);
    return NextResponse.json(
      { error: 'Failed to save design' },
      { status: 500 }
    );
  }
}

