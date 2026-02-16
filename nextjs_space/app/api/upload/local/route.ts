import { NextRequest, NextResponse } from 'next/server';
import { saveFileLocally, getLocalFileUrl, shouldUseLocalStorage } from '@/lib/local-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if AWS is configured - if so, don't use local storage
    if (!shouldUseLocalStorage()) {
      return NextResponse.json(
        { error: 'Local storage not enabled. AWS is configured.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const relativePath = await saveFileLocally(file.name, buffer, isPublic);
    const fileUrl = getLocalFileUrl(relativePath);

    console.log('[LOCAL-UPLOAD] File saved:', { relativePath, fileUrl, fileName: file.name });

    return NextResponse.json({
      cloud_storage_path: relativePath,
      url: fileUrl,
      message: 'File uploaded to local storage',
    });
  } catch (error) {
    console.error('[LOCAL-UPLOAD] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload file', details: errorMessage },
      { status: 500 }
    );
  }
}

