import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { parseSVG } from '@/lib/svg-parser'

export const dynamic = 'force-dynamic'

/**
 * Parse SVG content and extract layer information
 * POST /api/templates/parse-svg
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { svgContent } = await req.json()

    if (!svgContent) {
      return NextResponse.json({ error: 'SVG content is required' }, { status: 400 })
    }

    // Parse SVG
    const parsed = parseSVG(svgContent)

    return NextResponse.json({
      success: true,
      parsed
    })
  } catch (error) {
    console.error('Error parsing SVG:', error)
    return NextResponse.json(
      { error: 'Failed to parse SVG', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
