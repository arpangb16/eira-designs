import { requireAdmin } from '@/lib/admin-check'
import { SchoolsClient } from './_components/schools-client'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SchoolsPage() {
  await requireAdmin()


  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { teams: true },
      },
    },
  })

  const serializedSchools = schools.map(school => ({
    ...school,
    createdAt: school.createdAt.toISOString(),
    updatedAt: school.updatedAt.toISOString(),
  }))

  return <SchoolsClient schools={serializedSchools} />
}
