import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { generatePresignedUploadUrl } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      console.error('[UPLOAD] Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, contentType, isPublic } = body
    console.log('[UPLOAD] Presigned URL request:', { fileName, contentType, isPublic })

    if (!fileName || !contentType) {
      console.error('[UPLOAD] Missing required fields:', { fileName, contentType })
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      )
    }

    const result = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic ?? false
    )
    console.log('[UPLOAD] Generated presigned URL for:', result.cloud_storage_path)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[UPLOAD] Error generating presigned URL:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: errorMessage },
      { status: 500 }
    )
  }
}
