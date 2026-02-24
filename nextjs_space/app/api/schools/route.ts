import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { teams: true },
        },
      },
    })

    return NextResponse.json(schools)
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, logoPath, logoIsPublic } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const school = await prisma.school.create({
      data: {
        name,
        address: address ?? null,
        logoPath: logoPath ?? null,
        logoIsPublic: logoIsPublic ?? false,
      },
    })

    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error('Error creating school:', error)
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
  }
}
