import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const color = await prisma.color.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(color)
  } catch (error) {
    console.error('Error updating color:', error)
    return NextResponse.json({ error: 'Failed to update color' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const color = await prisma.color.findUnique({
      where: { id: params.id },
    })

    if (!color) {
      return NextResponse.json({ error: 'Color not found' }, { status: 404 })
    }

    await prisma.color.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Color deleted successfully' })
  } catch (error) {
    console.error('Error deleting color:', error)
    return NextResponse.json({ error: 'Failed to delete color' }, { status: 500 })
  }
}
