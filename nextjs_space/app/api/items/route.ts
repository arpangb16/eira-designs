import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { include: { team: { include: { school: true } } } },
        template: true,
        _count: { select: { designInstructions: true, generatedFiles: true } },
      },
    })
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, projectId, templateId, status } = await request.json()
    if (!name || !projectId) return NextResponse.json({ error: 'Name and projectId required' }, { status: 400 })
    const item = await prisma.item.create({
      data: { name, projectId, templateId: templateId ?? null, status: status ?? 'draft' },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
