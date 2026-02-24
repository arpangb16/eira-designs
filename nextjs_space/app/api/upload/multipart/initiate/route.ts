import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { initiateMultipartUpload } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
