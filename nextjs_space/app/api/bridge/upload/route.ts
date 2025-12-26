import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      designInstructionId,
      itemId,
      files, // Array of { fileName, fileType, filePath, fileIsPublic }
    } = body

    if (!itemId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'itemId and files array are required' },
        { status: 400 }
      )
    }

    // Create generated file records
    const createdFiles = await Promise.all(
      files.map((file: any) =>
        prisma.generatedFile.create({
          data: {
            itemId,
            designInstructionId: designInstructionId ?? null,
            fileName: file.fileName,
            fileType: file.fileType,
            filePath: file.filePath,
            fileIsPublic: file.fileIsPublic ?? false,
          },
        })
      )
    )

    // Update design instruction status if provided
    if (designInstructionId) {
      await prisma.designInstruction.update({
        where: { id: designInstructionId },
        data: { status: 'completed' },
      })
    }

    return NextResponse.json(
      {
        message: 'Files uploaded successfully',
        files: createdFiles,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading generated files:', error)
    return NextResponse.json(
      { error: 'Failed to upload generated files' },
      { status: 500 }
    )
  }
}
