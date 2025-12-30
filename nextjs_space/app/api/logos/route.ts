import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Get all logos with optional filtering by school, team, project, or item
 * GET /api/logos
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const teamId = searchParams.get('teamId');
    const projectId = searchParams.get('projectId');
    const itemId = searchParams.get('itemId');

    // Build filter
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (teamId) where.teamId = teamId;
    if (projectId) where.projectId = projectId;
    if (itemId) where.itemId = itemId;

    const logos = await prisma.logo.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        team: { select: { id: true, name: true, schoolId: true } },
        project: { select: { id: true, name: true } },
        item: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error('[LOGOS-GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logos' }, { status: 500 });
  }
}

/**
 * Create a new logo
 * POST /api/logos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, logoPath, logoIsPublic, schoolId, teamId, projectId, itemId } = body;

    // Validate required fields
    if (!name || !logoPath) {
      return NextResponse.json(
        { error: 'Name and logo file are required' },
        { status: 400 }
      );
    }

    // Validate that if teamId is provided, the schoolId matches (optional)
    if (teamId && schoolId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { schoolId: true },
      });
      if (team && team.schoolId !== schoolId) {
        return NextResponse.json(
          { error: 'Team does not belong to the selected school' },
          { status: 400 }
        );
      }
    }

    const logo = await prisma.logo.create({
      data: {
        name,
        description: description || null,
        logoPath,
        logoIsPublic: logoIsPublic || false,
        schoolId: schoolId || null,
        teamId: teamId || null,
        projectId: projectId || null,
        itemId: itemId || null,
      },
      include: {
        school: { select: { id: true, name: true } },
        team: { select: { id: true, name: true, schoolId: true } },
        project: { select: { id: true, name: true } },
        item: { select: { id: true, name: true } },
      },
    });

    console.log('[LOGOS-POST] Created logo:', logo.name);
    return NextResponse.json(logo, { status: 201 });
  } catch (error) {
    console.error('[LOGOS-POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create logo' }, { status: 500 });
  }
}
