import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bridge/jobs
 * Fetch pending bridge jobs for processing
 * Used by the bridge utility to poll for work
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get limit from query params (default 10)
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || 'pending';

    const jobs = await prisma.bridgeJob.findMany({
      where: { status },
      include: {
        variant: {
          include: {
            item: {
              include: {
                project: {
                  include: {
                    team: {
                      include: {
                        school: true,
                      },
                    },
                  },
                },
                template: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[BRIDGE_JOBS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch bridge jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bridge/jobs
 * Create bridge jobs for selected variants
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { variantIds, priority = 0 } = body;

    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json(
        { error: 'variantIds array is required' },
        { status: 400 }
      );
    }

    // Check if jobs already exist for these variants
    const existingJobs = await prisma.bridgeJob.findMany({
      where: {
        variantId: { in: variantIds },
        status: { in: ['pending', 'processing'] },
      },
    });

    const existingVariantIds = new Set(existingJobs.map(job => job.variantId));
    const newVariantIds = variantIds.filter(id => !existingVariantIds.has(id));

    // Create jobs for variants that don't have pending/processing jobs
    const jobs = await Promise.all(
      newVariantIds.map(async (variantId) => {
        // Update variant status to generating
        await prisma.designVariant.update({
          where: { id: variantId },
          data: { status: 'generating' },
        });

        return prisma.bridgeJob.create({
          data: {
            variantId,
            priority,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      created: jobs.length,
      skipped: existingJobs.length,
      jobs,
    });
  } catch (error) {
    console.error('[BRIDGE_JOBS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create bridge jobs' },
      { status: 500 }
    );
  }
}
