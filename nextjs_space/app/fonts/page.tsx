import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { FontsClient } from './_components/fonts-client'

export const dynamic = 'force-dynamic'

export default async function FontsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const fonts = await prisma.font.findMany({
    orderBy: [{ isSystemFont: 'desc' }, { name: 'asc' }],
  })

  return <FontsClient fonts={fonts} />
}
