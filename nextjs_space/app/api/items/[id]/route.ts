import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const item = await prisma.item.findUnique({
      where: { id: params?.id },
      include: {
        project: { include: { team: { include: { school: true } } } },
        template: true,
        designInstructions: { orderBy: { createdAt: 'desc' } },
        generatedFiles: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const item = await prisma.item.update({ where: { id: params?.id }, data: { ...body } })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.item.delete({ where: { id: params?.id } })
    return NextResponse.json({ message: 'Item deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
