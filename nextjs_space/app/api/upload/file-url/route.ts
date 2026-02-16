import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getFileUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION DISABLED - Allow file URL requests without session
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   console.error('[FILE-URL] Unauthorized: No session')
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

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
