import { DashboardClient } from './_components/dashboard-client'
import { requireAdmin } from '@/lib/admin-check'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await requireAdmin();

  // Fetch dashboard statistics (sequential to reduce connection pool pressure)
  const schoolsCount = await prisma.school.count()
  const teamsCount = await prisma.team.count()
  const projectsCount = await prisma.project.count()
  const itemsCount = await prisma.item.count()

  const stats = {
    schools: schoolsCount,
    teams: teamsCount,
    projects: projectsCount,
    items: itemsCount,
  }

  return <DashboardClient stats={stats} />
}
