import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// PATCH /api/items/[id]/variants/[variantId] - Update variant (e.g., toggle selection, update status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { variantId } = params;
    const body = await req.json();

    const variant = await prisma.designVariant.update({
      where: { id: variantId },
      data: body,
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
  }
}

// DELETE /api/items/[id]/variants/[variantId] - Delete a single variant
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { variantId } = params;

    // Fetch variant to get file paths
    const variant = await prisma.designVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Delete S3 files
    if (variant.previewSvgPath) {
      try {
        await deleteFile(variant.previewSvgPath);
      } catch (error) {
        console.error('Failed to delete preview SVG:', error);
      }
    }
    if (variant.finalAiPath) {
      try {
        await deleteFile(variant.finalAiPath);
      } catch (error) {
        console.error('Failed to delete final AI file:', error);
      }
    }

    // Delete database record
    await prisma.designVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({ success: true, message: 'Variant deleted' });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
  }
}
