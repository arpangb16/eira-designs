import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { SchoolDetailClient } from './_components/school-detail-client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SchoolDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const school = await prisma.school.findUnique({
    where: { id: params.id },
    include: {
      teams: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { projects: true }
          }
        }
      }
    }
  })

  if (!school) {
    redirect('/schools')
  }

  // Serialize dates
  const serializedSchool = {
    ...school,
    createdAt: school.createdAt.toISOString(),
    updatedAt: school.updatedAt.toISOString(),
    teams: school.teams.map((team: any) => ({
      ...team,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    }))
  }

  return <SchoolDetailClient school={serializedSchool} />
}
