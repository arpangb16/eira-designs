import { NextRequest, NextResponse } from 'next/server'
import { getFileUrl } from '@/lib/s3'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get design instruction by ID
    const designInstruction = await prisma.designInstruction.findUnique({
      where: { id: params?.id },
      include: {
        item: {
          include: {
            template: true,
            project: {
              include: {
                team: {
                  include: {
                    school: true,
                    manufacturerLogos: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!designInstruction) {
      return NextResponse.json(
        { error: 'Design instruction not found' },
        { status: 404 }
      )
    }

    // Get file URLs for template and logos
    const templateUrl = designInstruction.item?.template?.filePath
      ? await getFileUrl(
          designInstruction.item.template.filePath,
          designInstruction.item.template.fileIsPublic
        )
      : null

    const teamLogoUrl = designInstruction.item?.project?.team?.logoPath
      ? await getFileUrl(
          designInstruction.item.project.team.logoPath,
          designInstruction.item.project.team.logoIsPublic
        )
      : null

    const schoolLogoUrl = designInstruction.item?.project?.team?.school?.logoPath
      ? await getFileUrl(
          designInstruction.item.project.team.school.logoPath,
          designInstruction.item.project.team.school.logoIsPublic
        )
      : null

    // Get manufacturer logo (team-specific or default)
    const manufacturerLogo = designInstruction.item?.project?.team?.manufacturerLogos?.find(
      (logo) => !logo?.isDefault
    ) ?? await prisma.manufacturerLogo.findFirst({
      where: { isDefault: true },
    })

    const manufacturerLogoUrl = manufacturerLogo?.filePath
      ? await getFileUrl(manufacturerLogo.filePath, manufacturerLogo.fileIsPublic)
      : null

    // Construct response for bridge utility
    const response = {
      designInstructionId: designInstruction.id,
      itemId: designInstruction.item?.id,
      itemName: designInstruction.item?.name,
      instruction: designInstruction.instruction,
      parsedData: designInstruction.parsedData
        ? JSON.parse(designInstruction.parsedData)
        : null,
      template: designInstruction.item?.template
        ? {
            id: designInstruction.item.template.id,
            name: designInstruction.item.template.name,
            url: templateUrl,
          }
        : null,
      team: {
        id: designInstruction.item?.project?.team?.id,
        name: designInstruction.item?.project?.team?.name,
        primaryColor: designInstruction.item?.project?.team?.primaryColor,
        secondaryColor: designInstruction.item?.project?.team?.secondaryColor,
        logoUrl: teamLogoUrl,
      },
      school: {
        id: designInstruction.item?.project?.team?.school?.id,
        name: designInstruction.item?.project?.team?.school?.name,
        logoUrl: schoolLogoUrl,
      },
      manufacturerLogoUrl,
      project: {
        id: designInstruction.item?.project?.id,
        name: designInstruction.item?.project?.name,
        season: designInstruction.item?.project?.season,
        year: designInstruction.item?.project?.year,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching design instruction for bridge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch design instruction' },
      { status: 500 }
    )
  }
}
