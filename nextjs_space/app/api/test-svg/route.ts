import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const svgPath = path.join(process.cwd(), '..', '..', 'test_singlet.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch (error) {
    console.error('Error reading SVG:', error);
    return NextResponse.json({ error: 'Failed to load SVG' }, { status: 500 });
  }
}
