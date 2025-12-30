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

  // Serialize dates for client component
  const serializedItem = {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    project: {
      ...item.project,
      createdAt: item.project.createdAt.toISOString(),
      updatedAt: item.project.updatedAt.toISOString(),
      team: {
        ...item.project.team,
        createdAt: item.project.team.createdAt.toISOString(),
        updatedAt: item.project.team.updatedAt.toISOString(),
        school: {
          ...item.project.team.school,
          createdAt: item.project.team.school.createdAt.toISOString(),
          updatedAt: item.project.team.school.updatedAt.toISOString(),
        },
      },
    },
    template: item.template ? {
      ...item.template,
      createdAt: item.template.createdAt.toISOString(),
      updatedAt: item.template.updatedAt.toISOString(),
    } : null,
    designInstructions: item.designInstructions.map(di => ({
      ...di,
      createdAt: di.createdAt.toISOString(),
      updatedAt: di.updatedAt.toISOString(),
    })),
    generatedFiles: item.generatedFiles.map(gf => ({
      ...gf,
      createdAt: gf.createdAt.toISOString(),
    })),
  }

  const serializedProjects = projects.map(project => ({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    team: {
      ...project.team,
      createdAt: project.team.createdAt.toISOString(),
      updatedAt: project.team.updatedAt.toISOString(),
      school: {
        ...project.team.school,
        createdAt: project.team.school.createdAt.toISOString(),
        updatedAt: project.team.school.updatedAt.toISOString(),
      },
    },
  }))

  const serializedTemplates = templates.map(template => ({
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  }))

  return <ItemDetailClient item={serializedItem} projects={serializedProjects} templates={serializedTemplates} />
}
