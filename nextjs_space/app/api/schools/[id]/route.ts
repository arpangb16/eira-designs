import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { deleteFile } from '@/lib/s3'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const school = await prisma.school.findUnique({
      where: { id: params?.id },
      include: {
        teams: true,
      },
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json({ error: 'Failed to fetch school' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, logoPath, logoIsPublic } = body

    const school = await prisma.school.update({
      where: { id: params?.id },
      data: {
        name: name ?? undefined,
        address: address ?? undefined,
        logoPath: logoPath ?? undefined,
        logoIsPublic: logoIsPublic ?? undefined,
      },
    })

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error updating school:', error)
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const school = await prisma.school.findUnique({
      where: { id: params?.id },
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Delete logo from S3 if it exists
    if (school?.logoPath) {
      try {
        await deleteFile(school.logoPath)
      } catch (err) {
        console.error('Failed to delete logo from S3:', err)
      }
    }

    await prisma.school.delete({
      where: { id: params?.id },
    })

    return NextResponse.json({ message: 'School deleted successfully' })
  } catch (error) {
    console.error('Error deleting school:', error)
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 })
  }
}
