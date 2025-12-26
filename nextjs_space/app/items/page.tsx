import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { ItemsClient } from './_components/items-client'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ItemsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [items, projects, templates] = await Promise.all([
    prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { include: { team: { include: { school: true } } } },
        template: true,
        _count: { select: { designInstructions: true, generatedFiles: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: { name: 'asc' },
      include: { team: { include: { school: true } } },
    }),
    prisma.template.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <ItemsClient items={items} projects={projects} templates={templates} />
}
