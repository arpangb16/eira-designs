import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    })
    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, category, filePath, fileIsPublic, description } = await request.json()
    if (!name || !category || !filePath) {
      return NextResponse.json({ error: 'Name, category, and filePath required' }, { status: 400 })
    }
    const template = await prisma.template.create({
      data: { name, category, filePath, fileIsPublic: fileIsPublic ?? false, description: description ?? null },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
