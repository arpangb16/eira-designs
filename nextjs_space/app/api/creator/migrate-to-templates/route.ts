import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Creator template definitions - same as in creator-client
const CREATOR_TEMPLATES = [
  { id: '101', name: 'Cardinal', svgPath: '/creator/images/101.svg' },
  { id: '102', name: 'Classic', svgPath: '/creator/images/102.svg' },
  { id: '103', name: 'Circle Badge', svgPath: '/creator/images/103.svg' },
  { id: '104', name: 'Martin County', svgPath: '/creator/images/104.svg' },
  { id: '105', name: 'Wewa', svgPath: '/creator/images/105.svg' },
  { id: '107', name: 'Pattern', svgPath: '/creator/images/107.svg' },
  { id: '109', name: 'Falcons', svgPath: '/creator/images/109.svg' },
  { id: '110', name: 'Amberstone', svgPath: '/creator/images/110.svg' },
  { id: '111', name: 'Modern', svgPath: '/creator/images/111.svg' },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const created: Array<{ id: string; name: string }> = [];
    const skipped: Array<{ name: string; reason: string }> = [];

    for (const def of CREATOR_TEMPLATES) {
      const filePath = def.svgPath.startsWith('/')
        ? def.svgPath
        : `/${def.svgPath}`;

      const existing = await prisma.template.findFirst({
        where: {
          OR: [{ name: def.name }, { svgPath: filePath }],
        },
      });

      if (existing) {
        skipped.push({ name: def.name, reason: 'Already exists' });
        continue;
      }

      const template = await prisma.template.create({
        data: {
          name: def.name,
          category: 'Creator',
          filePath,
          fileIsPublic: true,
          svgPath: filePath,
          svgIsPublic: true,
          description: `Migrated from Creator (${def.id})`,
        },
      });

      created.push({ id: template.id, name: template.name });
    }

    if (created.length > 0) {
      revalidatePath('/templates');
    }

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      templates: created,
      skippedDetails: skipped,
    });
  } catch (error) {
    console.error('[MIGRATE-TO-TEMPLATES] Error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate templates' },
      { status: 500 }
    );
  }
}
