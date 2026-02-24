import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { deleteFile } from '@/lib/s3'

import { prisma } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const template = await prisma.template.findUnique({
      where: { id: params?.id },
      include: { items: true },
    })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const template = await prisma.template.update({ where: { id: params?.id }, data: { ...body } })
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const template = await prisma.template.findUnique({ where: { id: params?.id } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    
    // Delete .ai file
    if (template?.filePath) {
      try {
        await deleteFile(template.filePath)
      } catch (err) {
        console.error('Failed to delete AI file from S3:', err)
      }
    }
    
    // Delete SVG file if exists
    if (template?.svgPath) {
      try {
        await deleteFile(template.svgPath)
      } catch (err) {
        console.error('Failed to delete SVG file from S3:', err)
      }
    }
    
    await prisma.template.delete({ where: { id: params?.id } })
    return NextResponse.json({ message: 'Template deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
