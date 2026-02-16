import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List user's saved designs
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION DISABLED
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // END AUTHENTICATION DISABLED

    // Get or create a mock user for development
    let mockUser = await prisma.user.findFirst({
      where: { email: 'admin@eira.com' },
    });
    
    if (!mockUser) {
      mockUser = await prisma.user.create({
        data: {
          email: 'admin@eira.com',
          name: 'Admin User',
        },
      });
    }
    
    const mockUserId = mockUser.id;

    const designs = await prisma.creatorDesign.findMany({
      where: { userId: mockUserId },
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
    // AUTHENTICATION DISABLED
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // END AUTHENTICATION DISABLED

    // Get or create a mock user for development
    let mockUser = await prisma.user.findFirst({
      where: { email: 'admin@eira.com' },
    });
    
    if (!mockUser) {
      mockUser = await prisma.user.create({
        data: {
          email: 'admin@eira.com',
          name: 'Admin User',
        },
      });
      console.log('[CREATOR-DESIGNS] Created mock user:', mockUser.id);
    }
    
    const mockUserId = mockUser.id;

    const body = await request.json();
    const { name, schoolId, teamId, projectId, itemId, designData, previewImage, apparelType } = body;

    if (!name || !designData) {
      return NextResponse.json({ error: 'Name and design data are required' }, { status: 400 });
    }

    const design = await prisma.creatorDesign.create({
      data: {
        name,
        userId: mockUserId,
        schoolId: schoolId || null,
        teamId: teamId || null,
        projectId: projectId || null,
        itemId: itemId || null,
        designData: JSON.stringify(designData),
        previewImage: previewImage || null,
        apparelType: apparelType || 'tshirt',
      },
    });

    console.log('[CREATOR-DESIGNS] Design saved successfully:', design.id);
    return NextResponse.json(design, { status: 201 });
  } catch (error) {
    console.error('[CREATOR-DESIGNS] Error creating design:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CREATOR-DESIGNS] Full error:', error);
    return NextResponse.json({ error: 'Failed to save design', details: errorMessage }, { status: 500 });
  }
}
