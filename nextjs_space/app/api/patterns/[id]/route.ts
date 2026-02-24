import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { prisma } from '@/lib/db'
import { deleteFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pattern = await prisma.pattern.findUnique({
      where: { id: params.id },
    })

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
    }

    return NextResponse.json(pattern)
  } catch (error) {
    console.error('Error fetching pattern:', error)
    return NextResponse.json({ error: 'Failed to fetch pattern' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const pattern = await prisma.pattern.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(pattern)
  } catch (error) {
    console.error('Error updating pattern:', error)
    return NextResponse.json({ error: 'Failed to update pattern' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pattern = await prisma.pattern.findUnique({
      where: { id: params.id },
    })

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
    }

    // Delete files from S3
    if (pattern.filePath) {
      try {
        await deleteFile(pattern.filePath)
      } catch (error) {
        console.error('Error deleting pattern file from S3:', error)
      }
    }
    if (pattern.svgPath) {
      try {
        await deleteFile(pattern.svgPath)
      } catch (error) {
        console.error('Error deleting pattern SVG from S3:', error)
      }
    }
    if (pattern.thumbnailPath) {
      try {
        await deleteFile(pattern.thumbnailPath)
      } catch (error) {
        console.error('Error deleting pattern thumbnail from S3:', error)
      }
    }

    await prisma.pattern.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Pattern deleted successfully' })
  } catch (error) {
    console.error('Error deleting pattern:', error)
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 })
  }
}
