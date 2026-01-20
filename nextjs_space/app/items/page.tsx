import { requireAdmin } from '@/lib/admin-check'
import { ItemsClient } from './_components/items-client'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ItemsPage() {
  await requireAdmin();

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

  // Serialize dates for client component
  const serializedItems = items.map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    project: {
      ...item.project,
      createdAt: item.project.createdAt.toISOString(),
      updatedAt: item.project.updatedAt.toISOString(),
      team: {
        ...item.project.team,
        createdAt: item.project.team.createdAt.toISOString(),
        updatedAt: item.project.team.updatedAt.toISOString(),
        school: {
          ...item.project.team.school,
          createdAt: item.project.team.school.createdAt.toISOString(),
          updatedAt: item.project.team.school.updatedAt.toISOString(),
        },
      },
    },
    template: item.template ? {
      ...item.template,
      createdAt: item.template.createdAt.toISOString(),
      updatedAt: item.template.updatedAt.toISOString(),
    } : null,
  }))

  return <ItemsClient items={serializedItems} projects={projects} templates={templates} />
}
