import { requireAdmin } from '@/lib/admin-check'
import { prisma } from '@/lib/db'
import { ColorsClient } from './_components/colors-client'

export const dynamic = 'force-dynamic'

export default async function ColorsPage() {
  await requireAdmin()

  const colors = await prisma.color.findMany({
    orderBy: [{ isCustom: 'asc' }, { category: 'asc' }, { name: 'asc' }],
  })

  return <ColorsClient colors={colors} />
}
