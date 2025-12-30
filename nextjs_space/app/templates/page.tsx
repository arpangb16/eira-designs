import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { TemplatesClient } from './_components/templates-client'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true } } },
  })

  return <TemplatesClient templates={templates} />
}
