import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { ColorsClient } from './_components/colors-client'

export const dynamic = 'force-dynamic'

export default async function ColorsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const colors = await prisma.color.findMany({
    orderBy: [{ isCustom: 'asc' }, { category: 'asc' }, { name: 'asc' }],
  })

  return <ColorsClient colors={colors} />
}
