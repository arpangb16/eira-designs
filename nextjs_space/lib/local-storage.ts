import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const PUBLIC_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'public');

// Ensure upload directories exist
async function ensureDirectories() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
  if (!existsSync(PUBLIC_UPLOAD_DIR)) {
    await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });
  }
}

// Generate local file path
export function generateLocalFilePath(
  fileName: string,
  isPublic: boolean = false
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const relativePath = isPublic
    ? `uploads/public/${timestamp}-${sanitizedFileName}`
    : `uploads/${timestamp}-${sanitizedFileName}`;
  return relativePath;
}

// Save file to local storage
export async function saveFileLocally(
  fileName: string,
  fileBuffer: Buffer,
  isPublic: boolean = false
): Promise<string> {
  await ensureDirectories();
  
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = isPublic
    ? join(PUBLIC_UPLOAD_DIR, `${timestamp}-${sanitizedFileName}`)
    : join(UPLOAD_DIR, `${timestamp}-${sanitizedFileName}`);
  
  await writeFile(filePath, fileBuffer);
  
  const relativePath = isPublic
    ? `uploads/public/${timestamp}-${sanitizedFileName}`
    : `uploads/${timestamp}-${sanitizedFileName}`;
  
  return relativePath;
}

// Get file URL for local storage
export function getLocalFileUrl(relativePath: string): string {
  // Return path relative to public directory for Next.js to serve
  return `/${relativePath}`;
}

// Check if local storage should be used
export function shouldUseLocalStorage(): boolean {
  // Check for explicit override
  if (process.env.USE_LOCAL_STORAGE === 'true') {
    return true;
  }
  // Use local storage if AWS_BUCKET_NAME is not set
  return !process.env.AWS_BUCKET_NAME || process.env.AWS_BUCKET_NAME === '';
}

