import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/bridge/jobs/[id]
 * Update a bridge job (typically status updates from the bridge utility)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;
    const body = await req.json();
    const { status, errorMessage, finalAiPath, finalAiIsPublic } = body;

    const updates: any = {};
    
    if (status) {
      updates.status = status;
      
      if (status === 'processing' && !updates.startedAt) {
        updates.startedAt = new Date();
      }
      
      if (status === 'completed' || status === 'failed') {
        updates.completedAt = new Date();
      }
    }
    
    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage;
    }

    const job = await prisma.bridgeJob.update({
      where: { id: jobId },
      data: updates,
    });

    // Update variant status and paths if completed
    if (status === 'completed' && finalAiPath) {
      await prisma.designVariant.update({
        where: { id: job.variantId },
        data: {
          status: 'generated',
          finalAiPath,
          finalAiIsPublic: finalAiIsPublic ?? false,
          errorMessage: null,
        },
      });
    } else if (status === 'failed') {
      await prisma.designVariant.update({
        where: { id: job.variantId },
        data: {
          status: 'failed',
          errorMessage: errorMessage || 'Bridge job failed',
        },
      });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('[BRIDGE_JOB_PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update bridge job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bridge/jobs/[id]
 * Delete a bridge job
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;

    await prisma.bridgeJob.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BRIDGE_JOB_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete bridge job' },
      { status: 500 }
    );
  }
}
