import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, svgPath } = body;

    if (!name || !svgPath) {
      return NextResponse.json(
        { error: 'Name and svgPath are required' },
        { status: 400 }
      );
    }

    // Use svgPath as filePath for SVG-only templates
    const filePath = svgPath.startsWith('/') ? svgPath : `/${svgPath}`;

    // Check if already exists (by name or svgPath)
    const existing = await prisma.template.findFirst({
      where: {
        OR: [{ name }, { svgPath: filePath }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Template already exists', template: existing },
        { status: 409 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        category: 'Creator',
        filePath,
        fileIsPublic: true,
        svgPath: filePath,
        svgIsPublic: true,
        description: `Imported from Creator (${id || 'manual'})`,
      },
    });

    revalidatePath('/templates');

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[ADD-TO-TEMPLATE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add template' },
      { status: 500 }
    );
  }
}
