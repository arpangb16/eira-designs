import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { EmbellishmentsClient } from './_components/embellishments-client'

export const dynamic = 'force-dynamic'

export default async function EmbellishmentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const embellishments = await prisma.embellishment.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <EmbellishmentsClient embellishments={embellishments} />
}
