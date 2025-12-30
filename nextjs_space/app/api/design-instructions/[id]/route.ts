import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const designInstruction = await prisma.designInstruction.findUnique({
      where: { id: params.id },
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
        generatedFiles: true,
      },
    })

    if (!designInstruction) {
      return NextResponse.json(
        { error: 'Design instruction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(designInstruction)
  } catch (error) {
    console.error('Error fetching design instruction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch design instruction' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const designInstruction = await prisma.designInstruction.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(designInstruction)
  } catch (error) {
    console.error('Error updating design instruction:', error)
    return NextResponse.json(
      { error: 'Failed to update design instruction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.designInstruction.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Design instruction deleted' })
  } catch (error) {
    console.error('Error deleting design instruction:', error)
    return NextResponse.json(
      { error: 'Failed to delete design instruction' },
      { status: 500 }
    )
  }
}
