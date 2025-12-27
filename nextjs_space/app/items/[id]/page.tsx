import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { ItemDetailClient } from './_components/item-detail-client'

export const dynamic = 'force-dynamic'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      project: {
        include: {
          team: {
            include: {
              school: true
            }
          }
        }
      },
      template: true,
      designInstructions: {
        orderBy: { createdAt: 'desc' }
      },
      generatedFiles: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!item) {
    redirect('/items')
  }

  return <ItemDetailClient item={item} />
}
