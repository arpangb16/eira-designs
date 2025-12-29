import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { PatternsClient } from './_components/patterns-client'

export const dynamic = 'force-dynamic'

export default async function PatternsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const patterns = await prisma.pattern.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <PatternsClient patterns={patterns} />
}
