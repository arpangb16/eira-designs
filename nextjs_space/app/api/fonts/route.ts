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
    const fonts = await prisma.font.findMany({
      orderBy: { createdAt: 'desc' },
    })

    console.log('[FONTS] Fetched fonts:', fonts.length)
    return NextResponse.json({ fonts })
  } catch (error) {
    console.error('[FONTS] Error fetching fonts:', error)
    return NextResponse.json({ error: 'Failed to fetch fonts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, fontFamily, category, filePath, fileIsPublic, isSystemFont, previewImage, previewIsPublic } = body

    if (!name || !fontFamily || !category) {
      return NextResponse.json({ error: 'Name, fontFamily, and category are required' }, { status: 400 })
    }

    const font = await prisma.font.create({
      data: {
        name,
        fontFamily,
        category,
        filePath,
        fileIsPublic: fileIsPublic ?? false,
        isSystemFont: isSystemFont ?? false,
        previewImage,
        previewIsPublic: previewIsPublic ?? false,
      },
    })

    return NextResponse.json(font, { status: 201 })
  } catch (error) {
    console.error('Error creating font:', error)
    return NextResponse.json({ error: 'Failed to create font' }, { status: 500 })
  }
}
