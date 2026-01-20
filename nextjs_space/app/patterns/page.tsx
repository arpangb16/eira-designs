import { requireAdmin } from '@/lib/admin-check'
import { prisma } from '@/lib/db'
import { PatternsClient } from './_components/patterns-client'

export const dynamic = 'force-dynamic'

export default async function PatternsPage() {
  await requireAdmin()

  const patterns = await prisma.pattern.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <PatternsClient patterns={patterns} />
}
