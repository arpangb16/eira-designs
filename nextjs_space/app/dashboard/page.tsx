import { DashboardClient } from './_components/dashboard-client'
import { requireAdmin } from '@/lib/admin-check'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await requireAdmin();

  // Fetch dashboard statistics
  const [schoolsCount, teamsCount, projectsCount, itemsCount] = await Promise.all([
    prisma.school.count(),
    prisma.team.count(),
    prisma.project.count(),
    prisma.item.count(),
  ])

  const stats = {
    schools: schoolsCount,
    teams: teamsCount,
    projects: projectsCount,
    items: itemsCount,
  }

  return <DashboardClient stats={stats} />
}
