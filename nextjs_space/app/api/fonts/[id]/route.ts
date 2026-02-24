import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { prisma } from '@/lib/db'
import { deleteFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const font = await prisma.font.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(font)
  } catch (error) {
    console.error('Error updating font:', error)
    return NextResponse.json({ error: 'Failed to update font' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const font = await prisma.font.findUnique({
      where: { id: params.id },
    })

    if (!font) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 })
    }

    if (font.filePath) {
      try {
        await deleteFile(font.filePath)
      } catch (error) {
        console.error('Error deleting font file from S3:', error)
      }
    }
    if (font.previewImage) {
      try {
        await deleteFile(font.previewImage)
      } catch (error) {
        console.error('Error deleting font preview from S3:', error)
      }
    }

    await prisma.font.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Font deleted successfully' })
  } catch (error) {
    console.error('Error deleting font:', error)
    return NextResponse.json({ error: 'Failed to delete font' }, { status: 500 })
  }
}
