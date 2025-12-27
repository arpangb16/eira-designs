import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { ItemDetailClient } from './_components/item-detail-client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

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

  // Fetch all projects and templates for the edit form
  const projects = await prisma.project.findMany({
    include: {
      team: {
        include: {
          school: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  const templates = await prisma.template.findMany({
    orderBy: { name: 'asc' }
  })

  return <ItemDetailClient item={item} projects={projects} templates={templates} />
}
