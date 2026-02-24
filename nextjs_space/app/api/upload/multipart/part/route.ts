import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { getPresignedUrlForPart } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cloud_storage_path, uploadId, partNumber } = body

    if (!cloud_storage_path || !uploadId || !partNumber) {
      return NextResponse.json(
        { error: 'cloud_storage_path, uploadId, and partNumber are required' },
        { status: 400 }
      )
    }

    const url = await getPresignedUrlForPart(
      cloud_storage_path,
      uploadId,
      partNumber
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error getting presigned URL for part:', error)
    return NextResponse.json(
      { error: 'Failed to get presigned URL for part' },
      { status: 500 }
    )
  }
}
