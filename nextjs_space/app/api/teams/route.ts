import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teams = await prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
      include: { school: true, _count: { select: { projects: true } } },
    })
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, schoolId, logoPath, logoIsPublic, primaryColor, secondaryColor, address } = body

    if (!name || !schoolId) {
      return NextResponse.json({ error: 'Name and schoolId are required' }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name,
        schoolId,
        logoPath: logoPath ?? null,
        logoIsPublic: logoIsPublic ?? false,
        primaryColor: primaryColor ?? null,
        secondaryColor: secondaryColor ?? null,
        address: address ?? null,
      },
    })
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
