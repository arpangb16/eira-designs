import { requireAdmin } from '@/lib/admin-check'
import { ProjectsClient } from './_components/projects-client'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  await requireAdmin()

  const [projects, teams] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { team: { include: { school: true } }, _count: { select: { items: true } } },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' }, include: { school: true } }),
  ])

  return <ProjectsClient projects={projects} teams={teams} />
}
