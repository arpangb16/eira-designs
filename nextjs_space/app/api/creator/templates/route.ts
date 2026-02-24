import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Built-in creator templates (same 9 as hardcoded in creator-client)
const BUILTIN_TEMPLATES = [
  { id: '101', name: 'Cardinal', svgPath: '/creator/images/101.svg', isPublic: true },
  { id: '102', name: 'Classic', svgPath: '/creator/images/102.svg', isPublic: true },
  { id: '103', name: 'Circle Badge', svgPath: '/creator/images/103.svg', isPublic: true },
  { id: '104', name: 'Martin County', svgPath: '/creator/images/104.svg', isPublic: true },
  { id: '105', name: 'Wewa', svgPath: '/creator/images/105.svg', isPublic: true },
  { id: '107', name: 'Pattern', svgPath: '/creator/images/107.svg', isPublic: true },
  { id: '109', name: 'Falcons', svgPath: '/creator/images/109.svg', isPublic: true },
  { id: '110', name: 'Amberstone', svgPath: '/creator/images/110.svg', isPublic: true },
  { id: '111', name: 'Modern', svgPath: '/creator/images/111.svg', isPublic: true },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbTemplates = await prisma.template.findMany({
      where: { category: 'Creator' },
      orderBy: { createdAt: 'desc' },
      select: { id, name, svgPath, svgIsPublic, filePath, fileIsPublic },
    });

    const builtinPaths = new Set(BUILTIN_TEMPLATES.map((t) => t.svgPath));
    const customTemplates = dbTemplates
      .filter((t) => !builtinPaths.has(t.svgPath ?? ''))
      .map((t) => ({
        id: t.id,
        name: t.name,
        svgPath: t.svgPath ?? t.filePath,
        isPublic: t.svgIsPublic ?? t.fileIsPublic ?? false,
      }));

    const templates = [
      ...BUILTIN_TEMPLATES,
      ...customTemplates,
    ];

    return NextResponse.json(templates);
  } catch (error) {
    console.error('[CREATOR-TEMPLATES GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Add new creator template from uploaded image
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, cloud_storage_path, isPublic } = body;

    if (!name || !cloud_storage_path) {
      return NextResponse.json(
        { error: 'Name and cloud_storage_path are required' },
        { status: 400 }
      );
    }

    const filePath = cloud_storage_path.startsWith('/')
      ? cloud_storage_path
      : cloud_storage_path.replace(/^\/+/, '');

    const existing = await prisma.template.findFirst({
      where: {
        OR: [{ name }, { svgPath: filePath }, { filePath }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A template with this name or path already exists', template: existing },
        { status: 409 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        category: 'Creator',
        filePath,
        fileIsPublic: isPublic ?? true,
        svgPath: filePath,
        svgIsPublic: isPublic ?? true,
        description: 'Added from Creator',
      },
    });

    revalidatePath('/templates');
    revalidatePath('/creator');

    return NextResponse.json(
      { id: template.id, name: template.name, svgPath: template.svgPath, isPublic: template.svgIsPublic },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATOR-TEMPLATES POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add template' },
      { status: 500 }
    );
  }
}
