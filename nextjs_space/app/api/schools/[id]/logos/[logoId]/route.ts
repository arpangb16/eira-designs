import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// PATCH /api/schools/[id]/logos/[logoId] - Update a school logo
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; logoId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { logoId } = params;
    const body = await req.json();

    // If setting as default, unset other defaults
    if (body.isDefault) {
      const logo = await prisma.schoolLogo.findUnique({ where: { id: logoId } });
      if (logo) {
        await prisma.schoolLogo.updateMany({
          where: { schoolId: logo.schoolId, isDefault: true },
          data: { isDefault: false },
        });
      }
    }

    const updatedLogo = await prisma.schoolLogo.update({
      where: { id: logoId },
      data: body,
    });

    return NextResponse.json({ logo: updatedLogo });
  } catch (error) {
    console.error('Error updating school logo:', error);
    return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 });
  }
}

// DELETE /api/schools/[id]/logos/[logoId] - Delete a school logo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; logoId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { logoId } = params;

    const logo = await prisma.schoolLogo.findUnique({ where: { id: logoId } });

    if (!logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    // Delete from S3
    if (logo.logoPath) {
      try {
        await deleteFile(logo.logoPath);
      } catch (error) {
        console.error('Failed to delete logo file from S3:', error);
      }
    }

    // Delete from database
    await prisma.schoolLogo.delete({ where: { id: logoId } });

    return NextResponse.json({ success: true, message: 'Logo deleted' });
  } catch (error) {
    console.error('Error deleting school logo:', error);
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 });
  }
}
