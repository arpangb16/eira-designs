import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { deleteFile } from '@/lib/s3'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const team = await prisma.team.findUnique({
      where: { id: params?.id },
      include: { school: true, projects: true },
    })
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, schoolId, logoPath, logoIsPublic, primaryColor, secondaryColor, address } = body

    const team = await prisma.team.update({
      where: { id: params?.id },
      data: {
        name: name ?? undefined,
        schoolId: schoolId ?? undefined,
        logoPath: logoPath ?? undefined,
        logoIsPublic: logoIsPublic ?? undefined,
        primaryColor: primaryColor ?? undefined,
        secondaryColor: secondaryColor ?? undefined,
        address: address ?? undefined,
      },
    })
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const team = await prisma.team.findUnique({ where: { id: params?.id } })
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    if (team?.logoPath) {
      try {
        await deleteFile(team.logoPath)
      } catch (err) {
        console.error('Failed to delete logo from S3:', err)
      }
    }

    await prisma.team.delete({ where: { id: params?.id } })
    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
