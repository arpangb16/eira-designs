import { requireAdmin } from '@/lib/admin-check'
import { TemplatesClient } from './_components/templates-client'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  await requireAdmin()
  if (!session) redirect('/login')

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true } } },
  })

  return <TemplatesClient templates={templates} />
}
