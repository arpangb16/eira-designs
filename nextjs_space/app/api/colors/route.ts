import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const colors = await prisma.color.findMany({
      orderBy: [{ isCustom: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    })

    console.log('[COLORS] Fetched colors:', colors.length)
    return NextResponse.json({ colors })
  } catch (error) {
    console.error('[COLORS] Error fetching colors:', error)
    return NextResponse.json({ error: 'Failed to fetch colors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, hexCode, pantoneCode, category, isCustom } = body

    if (!name || !hexCode) {
      return NextResponse.json({ error: 'Name and hexCode are required' }, { status: 400 })
    }

    const color = await prisma.color.create({
      data: {
        name,
        hexCode,
        pantoneCode,
        category,
        isCustom: isCustom ?? true,
      },
    })

    return NextResponse.json(color, { status: 201 })
  } catch (error) {
    console.error('Error creating color:', error)
    return NextResponse.json({ error: 'Failed to create color' }, { status: 500 })
  }
}
