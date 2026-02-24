import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { team: { include: { school: true } }, _count: { select: { items: true } } },
    })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, teamId, season, year, description } = await request.json()
    if (!name || !teamId) return NextResponse.json({ error: 'Name and teamId required' }, { status: 400 })
    const project = await prisma.project.create({
      data: { name, teamId, season: season ?? null, year: year ?? null, description: description ?? null },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
