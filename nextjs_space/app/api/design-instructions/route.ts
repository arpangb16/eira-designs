import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const whereClause = status ? { status } : {}

    const instructions = await prisma.designInstruction.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ instructions })
  } catch (error) {
    console.error('Error fetching design instructions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch design instructions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, instruction, parsedData } = body

    if (!itemId || !instruction) {
      return NextResponse.json(
        { error: 'itemId and instruction are required' },
        { status: 400 }
      )
    }

    const designInstruction = await prisma.designInstruction.create({
      data: {
        itemId,
        instruction,
        parsedData: parsedData ? JSON.stringify(parsedData) : null,
        status: 'pending',
      },
    })

    return NextResponse.json(designInstruction, { status: 201 })
  } catch (error) {
    console.error('Error creating design instruction:', error)
    return NextResponse.json(
      { error: 'Failed to create design instruction' },
      { status: 500 }
    )
  }
}
