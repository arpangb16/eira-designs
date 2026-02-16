import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";
import { shouldUseLocalStorage, getLocalFileUrl } from "./local-storage";

// Lazy initialization - only create S3 client when AWS is configured
let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (shouldUseLocalStorage()) {
    return null;
  }
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

// Generate presigned URL for single-part upload (≤100MB recommended, 5GB max)
// Falls back to local storage if AWS is not configured
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  // Use local storage if AWS is not configured or if explicitly requested
  if (shouldUseLocalStorage()) {
    console.log('[LOCAL-STORAGE] Using local storage for:', fileName);
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const cloud_storage_path = isPublic
      ? `uploads/public/${timestamp}-${sanitizedFileName}`
      : `uploads/${timestamp}-${sanitizedFileName}`;
    
    // Return a special URL that indicates local upload endpoint
    const uploadUrl = `/api/upload/local`;
    return { uploadUrl, cloud_storage_path };
  }
  
  // Get AWS config only when needed
  const { bucketName, folderPrefix } = getBucketConfig();
  
  // Validate AWS configuration
  if (!bucketName) {
    console.log('[S3] AWS_BUCKET_NAME not set, falling back to local storage');
    // Fall back to local storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const cloud_storage_path = isPublic
      ? `uploads/public/${timestamp}-${sanitizedFileName}`
      : `uploads/${timestamp}-${sanitizedFileName}`;
    return { uploadUrl: `/api/upload/local`, cloud_storage_path };
  }
  
  const client = getS3Client();
  if (!client) {
    console.log('[S3] S3 client not available, falling back to local storage');
    // Fall back to local storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const cloud_storage_path = isPublic
      ? `uploads/public/${timestamp}-${sanitizedFileName}`
      : `uploads/${timestamp}-${sanitizedFileName}`;
    return { uploadUrl: `/api/upload/local`, cloud_storage_path };
  }
  
  console.log('[S3] Generating presigned URL for:', { fileName, contentType, isPublic, bucketName, folderPrefix });
  
  const timestamp = Date.now();
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${fileName}`
    : `${folderPrefix}uploads/${timestamp}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
  });

  try {
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    console.log('[S3] Successfully generated presigned URL for:', cloud_storage_path);
    return { uploadUrl, cloud_storage_path };
  } catch (error) {
    console.error('[S3] Error generating presigned URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate presigned URL: ${errorMessage}`);
  }
}

// Initiate multipart upload (for files >100MB)
export async function initiateMultipartUpload(
  fileName: string,
  isPublic: boolean = false
): Promise<{ uploadId: string; cloud_storage_path: string }> {
  if (shouldUseLocalStorage()) {
    throw new Error('Multipart upload not supported for local storage. Use single-part upload instead.');
  }
  
  const { bucketName, folderPrefix } = getBucketConfig();
  const client = getS3Client();
  if (!client || !bucketName) {
    throw new Error('AWS not configured');
  }
  
  const timestamp = Date.now();
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${fileName}`
    : `${folderPrefix}uploads/${timestamp}-${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  const response = await client.send(command);

  if (!response?.UploadId) {
    throw new Error("Failed to initiate multipart upload");
  }

  return { uploadId: response.UploadId, cloud_storage_path };
}

// Get presigned URL for uploading a part
export async function getPresignedUrlForPart(
  cloud_storage_path: string,
  uploadId: string,
  partNumber: number
): Promise<string> {
  if (shouldUseLocalStorage()) {
    throw new Error('Multipart upload not supported for local storage');
  }
  
  const { bucketName } = getBucketConfig();
  const client = getS3Client();
  if (!client || !bucketName) {
    throw new Error('AWS not configured');
  }
  
  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

// Complete multipart upload
export async function completeMultipartUpload(
  cloud_storage_path: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>
): Promise<void> {
  if (shouldUseLocalStorage()) {
    throw new Error('Multipart upload not supported for local storage');
  }
  
  const { bucketName } = getBucketConfig();
  const client = getS3Client();
  if (!client || !bucketName) {
    throw new Error('AWS not configured');
  }
  
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  });

  await client.send(command);
}

// Get file URL (public or signed)
export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean = false
): Promise<string> {
  // Use local storage if AWS is not configured
  if (shouldUseLocalStorage()) {
    return getLocalFileUrl(cloud_storage_path);
  }
  
  if (isPublic) {
    const region = process.env.AWS_REGION ?? "us-east-1";
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Delete file from S3
export async function deleteFile(cloud_storage_path: string): Promise<void> {
  if (shouldUseLocalStorage()) {
    // For local storage, we could implement file deletion here
    // For now, just log that deletion was requested
    console.log('[LOCAL-STORAGE] Delete requested for:', cloud_storage_path);
    return;
  }
  
  const { bucketName } = getBucketConfig();
  const client = getS3Client();
  if (!client || !bucketName) {
    throw new Error('AWS not configured');
  }
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  await client.send(command);
}
