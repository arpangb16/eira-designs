import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// GET /api/items/[id]/variants - List all variants for an item
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;

    const variants = await prisma.designVariant.findMany({
      where: { itemId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }
}

// DELETE /api/items/[id]/variants - Delete all variants for an item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;

    // Fetch all variants to get file paths
    const variants = await prisma.designVariant.findMany({
      where: { itemId },
    });

    // Delete S3 files
    await Promise.all(
      variants.map(async (variant) => {
        if (variant.previewSvgPath) {
          try {
            await deleteFile(variant.previewSvgPath);
          } catch (error) {
            console.error(`Failed to delete preview SVG for variant ${variant.id}:`, error);
          }
        }
        if (variant.finalAiPath) {
          try {
            await deleteFile(variant.finalAiPath);
          } catch (error) {
            console.error(`Failed to delete final AI file for variant ${variant.id}:`, error);
          }
        }
      })
    );

    // Delete database records
    await prisma.designVariant.deleteMany({
      where: { itemId },
    });

    return NextResponse.json({ success: true, message: 'All variants deleted' });
  } catch (error) {
    console.error('Error deleting variants:', error);
    return NextResponse.json({ error: 'Failed to delete variants' }, { status: 500 });
  }
}
