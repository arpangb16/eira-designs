import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { generatePresignedUploadUrl } from '@/lib/s3'
import { shouldUseLocalStorage } from '@/lib/local-storage'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION DISABLED - Allow uploads without session
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   console.error('[UPLOAD] Unauthorized: No session')
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { fileName, contentType, isPublic } = body
    console.log('[UPLOAD] Presigned URL request:', { fileName, contentType, isPublic })
    console.log('[UPLOAD] Storage mode:', shouldUseLocalStorage() ? 'LOCAL' : 'AWS', {
      awsBucketName: process.env.AWS_BUCKET_NAME ? 'set' : 'not set'
    })

    if (!fileName || !contentType) {
      console.error('[UPLOAD] Missing required fields:', { fileName, contentType })
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      )
    }

    try {
      const result = await generatePresignedUploadUrl(
        fileName,
        contentType,
        isPublic ?? false
      )
      console.log('[UPLOAD] Generated upload URL for:', result.cloud_storage_path)

      return NextResponse.json(result)
    } catch (awsError) {
      // If AWS fails, fall back to local storage
      console.error('[UPLOAD] AWS upload failed, falling back to local storage:', awsError)
      console.log('[UPLOAD] Using local storage fallback')
      
      const timestamp = Date.now()
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const cloud_storage_path = isPublic
        ? `uploads/public/${timestamp}-${sanitizedFileName}`
        : `uploads/${timestamp}-${sanitizedFileName}`
      
      return NextResponse.json({
        uploadUrl: '/api/upload/local',
        cloud_storage_path,
      })
    }
  } catch (error) {
    console.error('[UPLOAD] Error generating upload URL:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Final fallback to local storage
    console.log('[UPLOAD] Final fallback to local storage')
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const cloud_storage_path = isPublic
      ? `uploads/public/${timestamp}-${sanitizedFileName}`
      : `uploads/${timestamp}-${sanitizedFileName}`
    
    return NextResponse.json({
      uploadUrl: '/api/upload/local',
      cloud_storage_path,
    })
    
    console.error('[UPLOAD] Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      awsConfig: {
        bucketName: process.env.AWS_BUCKET_NAME ? 'set' : 'missing',
        region: process.env.AWS_REGION ? 'set' : 'missing',
        accessKey: process.env.AWS_ACCESS_KEY_ID ? 'set' : 'missing',
      }
    })
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: errorMessage },
      { status: 500 }
    )
  }
}
