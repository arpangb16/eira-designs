import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Get a specific design
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // AUTHENTICATION DISABLED
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // END AUTHENTICATION DISABLED

    const design = await prisma.creatorDesign.findUnique({
      where: { id: params.id },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // AUTHENTICATION DISABLED - Skip ownership check
    // if (design.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    return NextResponse.json(design);
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
  }
}

// PATCH - Update a design
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // AUTHENTICATION DISABLED
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // END AUTHENTICATION DISABLED

    const design = await prisma.creatorDesign.findUnique({
      where: { id: params.id },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // AUTHENTICATION DISABLED - Skip ownership check
    // if (design.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();
    const { name, schoolId, teamId, projectId, itemId, designData, previewImage, apparelType } = body;

    const updated = await prisma.creatorDesign.update({
      where: { id: params.id },
      data: {
        name: name || design.name,
        schoolId: schoolId !== undefined ? schoolId : design.schoolId,
        teamId: teamId !== undefined ? teamId : design.teamId,
        projectId: projectId !== undefined ? projectId : design.projectId,
        itemId: itemId !== undefined ? itemId : design.itemId,
        designData: designData ? JSON.stringify(designData) : design.designData,
        previewImage: previewImage !== undefined ? previewImage : design.previewImage,
        apparelType: apparelType || design.apparelType,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Error updating design:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update design', details: errorMessage }, { status: 500 });
  }
}

// DELETE - Delete a design
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // AUTHENTICATION DISABLED
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // END AUTHENTICATION DISABLED

    const design = await prisma.creatorDesign.findUnique({
      where: { id: params.id },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // AUTHENTICATION DISABLED - Skip ownership check
    // if (design.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    await prisma.creatorDesign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Error deleting design:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete design', details: errorMessage }, { status: 500 });
  }
}


