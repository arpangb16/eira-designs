import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { ProjectDetailClient } from './_components/project-detail-client'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      team: {
        include: {
          school: true
        }
      },
      items: {
        orderBy: { createdAt: 'desc' },
        include: {
          template: true,
          _count: {
            select: {
              designInstructions: true,
              generatedFiles: true
            }
          }
        }
      }
    }
  })

  if (!project) {
    redirect('/projects')
  }

  // Fetch all templates for the add item dialog
  const templates = await prisma.template.findMany({
    orderBy: { name: 'asc' }
  })

  return <ProjectDetailClient project={project} templates={templates} />
}
