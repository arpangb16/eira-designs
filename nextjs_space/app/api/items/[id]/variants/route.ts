import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, getBucketConfig } from '@/lib/aws-config';

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

// POST /api/items/[id]/variants - Create a new variant
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const { variantName, configuration, previewSvg } = await req.json();

    if (!variantName || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields: variantName, configuration' },
        { status: 400 }
      );
    }

    // Verify item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    let previewSvgPath: string | undefined;
    let previewIsPublic = true;

    // Upload preview SVG to S3 if provided
    if (previewSvg) {
      try {
        const s3Client = createS3Client();
        const { bucketName, folderPrefix } = getBucketConfig();
        
        const fileName = `${Date.now()}-${variantName.replace(/[^a-z0-9]/gi, '_')}.svg`;
        previewSvgPath = `${folderPrefix}public/variants/${fileName}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: previewSvgPath,
            Body: Buffer.from(previewSvg),
            ContentType: 'image/svg+xml',
          })
        );
      } catch (error) {
        console.error('Failed to upload preview SVG:', error);
        // Continue without preview - not critical
      }
    }

    // Create variant in database
    const variant = await prisma.designVariant.create({
      data: {
        itemId,
        variantName,
        configuration,
        status: 'preview',
        previewSvgPath,
        previewIsPublic,
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
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
