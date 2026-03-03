import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { getFileUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      console.error('[FILE-URL] Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cloud_storage_path, isPublic } = body
    console.log('[FILE-URL] Request for:', { cloud_storage_path, isPublic })

    if (!cloud_storage_path) {
      console.error('[FILE-URL] Missing cloud_storage_path')
      return NextResponse.json(
        { error: 'cloud_storage_path is required' },
        { status: 400 }
      )
    }

    if (cloud_storage_path.startsWith('uploads/') || cloud_storage_path.startsWith('/creator/')) {
      const path = cloud_storage_path.startsWith('/') ? cloud_storage_path : `/${cloud_storage_path}`;
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      return NextResponse.json({ url: `${baseUrl}${path}` });
    }

    const url = await getFileUrl(cloud_storage_path, isPublic ?? false)
    console.log('[FILE-URL] Generated URL successfully for:', cloud_storage_path)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[FILE-URL] Error getting file URL:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get file URL', details: errorMessage },
      { status: 500 }
    )
  }
}
