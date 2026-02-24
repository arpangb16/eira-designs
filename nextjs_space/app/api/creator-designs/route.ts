import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List user's saved designs
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const designs = await prisma.creatorDesign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(designs);
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}

// POST - Save a new design
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, schoolId, teamId, projectId, itemId, designData, previewImage, apparelType } = body;

    if (!name || !designData) {
      return NextResponse.json({ error: 'Name and design data are required' }, { status: 400 });
    }

    const design = await prisma.creatorDesign.create({
      data: {
        name,
        userId: session.user.id,
        schoolId: schoolId || null,
        teamId: teamId || null,
        projectId: projectId || null,
        itemId: itemId || null,
        designData: JSON.stringify(designData),
        previewImage: previewImage || null,
        apparelType: apparelType || 'tshirt',
      },
    });

    return NextResponse.json(design, { status: 201 });
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Error creating design:', error);
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 });
  }
}
