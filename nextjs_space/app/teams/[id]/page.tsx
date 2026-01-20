import { requireAdmin } from '@/lib/admin-check'
import { TeamDetailClient } from './_components/team-detail-client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      school: true,
      projects: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { items: true }
          }
        }
      }
    }
  })

  if (!team) {
    redirect('/teams')
  }

  // Serialize dates
  const serializedTeam = {
    ...team,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    school: {
      ...team.school,
      createdAt: team.school.createdAt.toISOString(),
      updatedAt: team.school.updatedAt.toISOString(),
    },
    projects: team.projects.map((project: any) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }))
  }

  return <TeamDetailClient team={serializedTeam} />
}
