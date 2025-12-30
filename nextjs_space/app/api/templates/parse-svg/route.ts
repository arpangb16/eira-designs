import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { parseSVG } from '@/lib/svg-parser-improved'

export const dynamic = 'force-dynamic'

/**
 * Parse SVG content and extract layer information
 * POST /api/templates/parse-svg
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      console.error('[PARSE-SVG] Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { svgContent } = await req.json()
    console.log('[PARSE-SVG] Received SVG content, length:', svgContent?.length || 0)

    if (!svgContent) {
      console.error('[PARSE-SVG] Missing SVG content')
      return NextResponse.json({ error: 'SVG content is required' }, { status: 400 })
    }

    // Parse SVG
    console.log('[PARSE-SVG] Starting SVG parsing...')
    const parsed = parseSVG(svgContent)
    console.log('[PARSE-SVG] SVG parsed successfully, layers found:', parsed?.layers?.length || 0)

    return NextResponse.json({
      success: true,
      parsed
    })
  } catch (error) {
    console.error('[PARSE-SVG] Error parsing SVG:', error)
    return NextResponse.json(
      { error: 'Failed to parse SVG', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
