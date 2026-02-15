import { requireAdmin } from '@/lib/admin-check'
import { prisma } from '@/lib/db'
import { EmbellishmentsClient } from './_components/embellishments-client'

export const dynamic = 'force-dynamic'

export default async function EmbellishmentsPage() {
  await requireAdmin()

  const embellishments = await prisma.embellishment.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <EmbellishmentsClient embellishments={embellishments} />
}
