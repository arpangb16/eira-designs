import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/items/[id]/logos
 * Fetches logos relevant to a specific item (filtered by team and project)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;

    // Fetch the item with its project and team relationships
    const item = await prisma.item.findUnique({
      where: { id: itemId },
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
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const projectId = item.projectId;
    const teamId = item.project.teamId;
    const schoolId = item.project.team.schoolId;

    // Fetch logos associated with:
    // 1. This specific item
    // 2. The item's project
    // 3. The project's team
    // 4. The team's school
    // 5. Generic logos (not associated with any entity)
    const logos = await prisma.logo.findMany({
      where: {
        OR: [
          { itemId: itemId },
          { projectId: projectId },
          { teamId: teamId },
          { schoolId: schoolId },
          {
            AND: [
              { itemId: null },
              { projectId: null },
              { teamId: null },
              { schoolId: null },
            ],
          },
        ],
      },
      orderBy: [
        // Prioritize by specificity: item > project > team > school > generic
        { itemId: { sort: "asc", nulls: "last" } },
        { projectId: { sort: "asc", nulls: "last" } },
        { teamId: { sort: "asc", nulls: "last" } },
        { schoolId: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        school: { select: { name: true } },
        team: { select: { name: true } },
        project: { select: { name: true } },
        item: { select: { name: true } },
      },
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error("[ITEM_LOGOS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch logos" },
      { status: 500 }
    );
  }
}
