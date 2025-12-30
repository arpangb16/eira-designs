import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { deleteFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const embellishment = await prisma.embellishment.findUnique({
      where: { id: params.id },
    })

    if (!embellishment) {
      return NextResponse.json({ error: 'Embellishment not found' }, { status: 404 })
    }

    return NextResponse.json(embellishment)
  } catch (error) {
    console.error('Error fetching embellishment:', error)
    return NextResponse.json({ error: 'Failed to fetch embellishment' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const embellishment = await prisma.embellishment.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(embellishment)
  } catch (error) {
    console.error('Error updating embellishment:', error)
    return NextResponse.json({ error: 'Failed to update embellishment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const embellishment = await prisma.embellishment.findUnique({
      where: { id: params.id },
    })

    if (!embellishment) {
      return NextResponse.json({ error: 'Embellishment not found' }, { status: 404 })
    }

    if (embellishment.filePath) {
      try {
        await deleteFile(embellishment.filePath)
      } catch (error) {
        console.error('Error deleting embellishment file from S3:', error)
      }
    }
    if (embellishment.svgPath) {
      try {
        await deleteFile(embellishment.svgPath)
      } catch (error) {
        console.error('Error deleting embellishment SVG from S3:', error)
      }
    }
    if (embellishment.thumbnailPath) {
      try {
        await deleteFile(embellishment.thumbnailPath)
      } catch (error) {
        console.error('Error deleting embellishment thumbnail from S3:', error)
      }
    }

    await prisma.embellishment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Embellishment deleted successfully' })
  } catch (error) {
    console.error('Error deleting embellishment:', error)
    return NextResponse.json({ error: 'Failed to delete embellishment' }, { status: 500 })
  }
}
