import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { initiateMultipartUpload } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION DISABLED - Allow uploads without session
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { fileName, isPublic } = body

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      )
    }

    const result = await initiateMultipartUpload(fileName, isPublic ?? false)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error initiating multipart upload:', error)
    return NextResponse.json(
      { error: 'Failed to initiate multipart upload' },
      { status: 500 }
    )
  }
}
