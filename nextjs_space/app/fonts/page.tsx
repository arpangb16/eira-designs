import { requireAdmin } from '@/lib/admin-check'
import { prisma } from '@/lib/db'
import { FontsClient } from './_components/fonts-client'

export const dynamic = 'force-dynamic'

export default async function FontsPage() {
  await requireAdmin()

  const fonts = await prisma.font.findMany({
    orderBy: [{ isSystemFont: 'desc' }, { name: 'asc' }],
  })

  return <FontsClient fonts={fonts} />
}
