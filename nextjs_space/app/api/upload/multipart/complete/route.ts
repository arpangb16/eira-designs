import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { completeMultipartUpload } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION DISABLED - Allow uploads without session
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { cloud_storage_path, uploadId, parts } = body

    if (!cloud_storage_path || !uploadId || !parts) {
      return NextResponse.json(
        { error: 'cloud_storage_path, uploadId, and parts are required' },
        { status: 400 }
      )
    }

    await completeMultipartUpload(cloud_storage_path, uploadId, parts)

    return NextResponse.json({ 
      message: 'Upload completed successfully',
      cloud_storage_path 
    })
  } catch (error) {
    console.error('Error completing multipart upload:', error)
    return NextResponse.json(
      { error: 'Failed to complete multipart upload' },
      { status: 500 }
    )
  }
}
