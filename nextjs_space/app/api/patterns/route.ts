import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const patterns = await prisma.pattern.findMany({
      orderBy: { createdAt: 'desc' },
    })

    console.log('[PATTERNS] Fetched patterns:', patterns.length)
    return NextResponse.json({ patterns })
  } catch (error) {
    console.error('[PATTERNS] Error fetching patterns:', error)
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
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
