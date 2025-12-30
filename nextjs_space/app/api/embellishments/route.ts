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
    const embellishments = await prisma.embellishment.findMany({
      orderBy: { createdAt: 'desc' },
    })

    console.log('[EMBELLISHMENTS] Fetched embellishments:', embellishments.length)
    return NextResponse.json({ embellishments })
  } catch (error) {
    console.error('[EMBELLISHMENTS] Error fetching embellishments:', error)
    return NextResponse.json({ error: 'Failed to fetch embellishments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, category, description, filePath, fileIsPublic, svgPath, svgIsPublic, thumbnailPath, thumbnailIsPublic } = body

    if (!name || !filePath) {
      return NextResponse.json({ error: 'Name and filePath are required' }, { status: 400 })
    }

    const embellishment = await prisma.embellishment.create({
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
      },
    })

    return NextResponse.json(embellishment, { status: 201 })
  } catch (error) {
    console.error('Error creating embellishment:', error)
    return NextResponse.json({ error: 'Failed to create embellishment' }, { status: 500 })
  }
}
