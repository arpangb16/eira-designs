import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { TeamsClient } from './_components/teams-client'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [teams, schools] = await Promise.all([
    prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        school: true,
        _count: { select: { projects: true } },
      },
    }),
    prisma.school.findMany({ orderBy: { name: 'asc' } }),
  ])

  const serializedTeams = teams.map(team => ({
    ...team,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    school: { ...team.school, createdAt: team.school.createdAt.toISOString(), updatedAt: team.school.updatedAt.toISOString() },
  }))

  return <TeamsClient teams={serializedTeams} schools={schools} />
}
