import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// GET /api/schools/[id]/logos - Get all logos for a school
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = params.id;

    const logos = await prisma.schoolLogo.findMany({
      where: { schoolId },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error('Error fetching school logos:', error);
    return NextResponse.json({ error: 'Failed to fetch logos' }, { status: 500 });
  }
}

// POST /api/schools/[id]/logos - Create a new logo for a school
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = params.id;
    const body = await req.json();
    const { name, logoPath, isDefault } = body;

    if (!name || !logoPath) {
      return NextResponse.json({ error: 'Name and logo path are required' }, { status: 400 });
    }

    // If this logo is set as default, unset other defaults
    if (isDefault) {
      await prisma.schoolLogo.updateMany({
        where: { schoolId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const logo = await prisma.schoolLogo.create({
      data: {
        schoolId,
        name,
        logoPath,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ logo }, { status: 201 });
  } catch (error) {
    console.error('Error creating school logo:', error);
    return NextResponse.json({ error: 'Failed to create logo' }, { status: 500 });
  }
}
