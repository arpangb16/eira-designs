import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getUserId(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  let userId = (session.user as any).id as string | undefined;
  if (!userId && session.user.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = user?.id;
  }
  return userId;
}

/** GET /api/creator/designs/[id] - Get one saved product */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const design = await prisma.creatorDesign.findFirst({
      where: { id: params.id, userId },
    });
    if (!design) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ design });
  } catch (error) {
    console.error('[CREATOR-DESIGNS] GET by id failed:', error);
    return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
  }
}

/** PATCH /api/creator/designs/[id] - Update a saved product */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, designData, apparelType } = body;

    const existing = await prisma.creatorDesign.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: { name?: string; designData?: string; apparelType?: string } = {};
    if (name != null) data.name = String(name);
    if (designData != null) {
      data.designData = typeof designData === 'string' ? designData : JSON.stringify(designData);
    }
    if (apparelType != null) data.apparelType = String(apparelType);

    const updated = await prisma.creatorDesign.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[CREATOR-DESIGNS] PATCH failed:', error);
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
  }
}

/** DELETE /api/creator/designs/[id] - Delete a saved product */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.creatorDesign.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.creatorDesign.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CREATOR-DESIGNS] DELETE failed:', error);
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }
}
