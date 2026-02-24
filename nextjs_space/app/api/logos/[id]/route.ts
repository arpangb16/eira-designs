import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/**
 * Get a single logo by ID
 * GET /api/logos/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logo = await prisma.logo.findUnique({
      where: { id: params.id },
      include: {
        school: { select: { id: true, name: true } },
        team: { select: { id: true, name: true, schoolId: true } },
        project: { select: { id: true, name: true } },
        item: { select: { id: true, name: true } },
      },
    });

    if (!logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    return NextResponse.json(logo);
  } catch (error) {
    console.error('[LOGO-GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logo' }, { status: 500 });
  }
}

/**
 * Update a logo
 * PATCH /api/logos/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate team-school relationship if both provided
    if (body.teamId && body.schoolId) {
      const team = await prisma.team.findUnique({
        where: { id: body.teamId },
        select: { schoolId: true },
      });
      if (team && team.schoolId !== body.schoolId) {
        return NextResponse.json(
          { error: 'Team does not belong to the selected school' },
          { status: 400 }
        );
      }
    }

    const logo = await prisma.logo.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description !== undefined ? body.description : undefined,
        logoPath: body.logoPath,
        logoIsPublic: body.logoIsPublic !== undefined ? body.logoIsPublic : undefined,
        schoolId: body.schoolId !== undefined ? (body.schoolId || null) : undefined,
        teamId: body.teamId !== undefined ? (body.teamId || null) : undefined,
        projectId: body.projectId !== undefined ? (body.projectId || null) : undefined,
        itemId: body.itemId !== undefined ? (body.itemId || null) : undefined,
      },
      include: {
        school: { select: { id: true, name: true } },
        team: { select: { id: true, name: true, schoolId: true } },
        project: { select: { id: true, name: true } },
        item: { select: { id: true, name: true } },
      },
    });

    console.log('[LOGO-PATCH] Updated logo:', logo.name);
    return NextResponse.json(logo);
  } catch (error) {
    console.error('[LOGO-PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 });
  }
}

/**
 * Delete a logo
 * DELETE /api/logos/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logo = await prisma.logo.findUnique({
      where: { id: params.id },
    });

    if (!logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    // Delete logo file from S3
    if (logo.logoPath) {
      try {
        await deleteFile(logo.logoPath);
        console.log('[LOGO-DELETE] Deleted S3 file:', logo.logoPath);
      } catch (err) {
        console.error('[LOGO-DELETE] Failed to delete S3 file:', err);
      }
    }

    await prisma.logo.delete({
      where: { id: params.id },
    });

    console.log('[LOGO-DELETE] Deleted logo:', logo.name);
    return NextResponse.json({ message: 'Logo deleted' });
  } catch (error) {
    console.error('[LOGO-DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 });
  }
}
