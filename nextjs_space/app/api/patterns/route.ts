import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const patterns = await prisma.pattern.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(patterns)
  } catch (error) {
    console.error('Error fetching patterns:', error)
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, category, description, filePath, fileIsPublic, svgPath, svgIsPublic, thumbnailPath, thumbnailIsPublic, colors } = body

    if (!name || !category || !filePath) {
      return NextResponse.json({ error: 'Name, category, and filePath are required' }, { status: 400 })
    }

    const pattern = await prisma.pattern.create({
      data: {
        name,
        category,
        description,
        filePath,
        fileIsPublic: fileIsPublic ?? false,
        svgPath,
        svgIsPublic: svgIsPublic ?? false,
        thumbnailPath,
        thumbnailIsPublic: thumbnailIsPublic ?? false,
        colors,
      },
    })

    return NextResponse.json(pattern, { status: 201 })
  } catch (error) {
    console.error('Error creating pattern:', error)
    return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 })
  }
}
