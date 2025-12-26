import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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
