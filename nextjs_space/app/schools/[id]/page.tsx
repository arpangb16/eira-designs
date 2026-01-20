import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-check'
import { SchoolDetailClient } from './_components/school-detail-client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SchoolDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()

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
    redirect('/schools');
    return null;
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
