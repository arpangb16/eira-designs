import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';
import path from 'path';
import { unlink } from 'fs/promises';

export const dynamic = 'force-dynamic';

const BUILTIN_IDS = new Set(['101', '102', '103', '104', '105', '107', '109', '110', '111']);

// Delete file from local storage or S3
async function deleteTemplateFile(filePath: string | null): Promise<void> {
  if (!filePath) return;

  const normalized = filePath.replace(/^\/+/, '');

  // Local uploads (uploads/filename) - delete from public/uploads
  if (normalized.startsWith('uploads/')) {
    try {
      const fullPath = path.join(process.cwd(), 'public', normalized);
      await unlink(fullPath);
    } catch (err) {
      console.warn('[CREATOR-TEMPLATE] Failed to delete local file:', normalized, err);
    }
    return;
  }

  // /creator/images/* - built-in, do not delete
  if (normalized.startsWith('creator/')) return;

  // S3 path - use deleteFile
  try {
    await deleteFile(filePath);
  } catch (err) {
    console.warn('[CREATOR-TEMPLATE] Failed to delete S3 file:', filePath, err);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    // Built-in templates don't have DB records
    if (BUILTIN_IDS.has(id)) {
      return NextResponse.json({ error: 'Built-in template, use static path' }, { status: 400 });
    }

    const template = await prisma.template.findFirst({
      where: { id, category: 'Creator' },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: template.id,
      name: template.name,
      svgPath: template.svgPath ?? template.filePath,
      isPublic: template.svgIsPublic ?? template.fileIsPublic ?? false,
    });
  } catch (error) {
    console.error('[CREATOR-TEMPLATE GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    if (BUILTIN_IDS.has(id)) {
      return NextResponse.json({ error: 'Cannot edit built-in template' }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    const existing = await prisma.template.findFirst({
      where: { id, category: 'Creator' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = await prisma.template.update({
      where: { id },
      data: name != null ? { name } : {},
    });

    revalidatePath('/creator');
    revalidatePath('/templates');

    return NextResponse.json({
      id: template.id,
      name: template.name,
      svgPath: template.svgPath ?? template.filePath,
      isPublic: template.svgIsPublic ?? template.fileIsPublic ?? false,
    });
  } catch (error) {
    console.error('[CREATOR-TEMPLATE PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    if (BUILTIN_IDS.has(id)) {
      return NextResponse.json({ error: 'Cannot delete built-in template' }, { status: 400 });
    }

    const template = await prisma.template.findFirst({
      where: { id, category: 'Creator' },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Delete file from local or S3
    await deleteTemplateFile(template.svgPath);
    if (template.filePath !== template.svgPath) {
      await deleteTemplateFile(template.filePath);
    }

    await prisma.template.delete({ where: { id } });

    revalidatePath('/creator');
    revalidatePath('/templates');

    return NextResponse.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('[CREATOR-TEMPLATE DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
