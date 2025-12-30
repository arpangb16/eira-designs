'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUploadComplete: (cloud_storage_path: string, isPublic: boolean) => void
  accept?: string
  label?: string
  isPublic?: boolean
  maxSize?: number // in MB
  existingFileName?: string | null // Show existing file name
  existingFilePath?: string | null // The cloud storage path of existing file
}

export function FileUpload({ 
  onUploadComplete, 
  accept = 'image/*',
  label = 'Upload File',
  isPublic = false,
  maxSize = 100, // Default 100MB for single-part upload
  existingFileName = null,
  existingFilePath = null
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [keepExisting, setKeepExisting] = useState(!!existingFilePath)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file size
    const fileSizeMB = selectedFile.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    setFile(selectedFile)
    setKeepExisting(false) // New file selected, replace existing
    setError('')
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const fileSizeMB = file.size / (1024 * 1024)

      if (fileSizeMB <= 100) {
        // Single-part upload for files ≤ 100MB
        await singlePartUpload(file)
      } else {
        // Multipart upload for files > 100MB
        await multipartUpload(file)
      }

      setSuccess(true)
      setTimeout(() => {
        setFile(null)
        setSuccess(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)
    } catch (err) {
      console.error('[FileUpload] Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const singlePartUpload = async (file: File) => {
    // Get presigned URL
    console.log('[FileUpload] Requesting presigned URL for:', file.name)
    const response = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        isPublic,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[FileUpload] Failed to get upload URL:', errorData)
      throw new Error(errorData.error || 'Failed to get upload URL')
    }

    const { uploadUrl, cloud_storage_path } = await response.json()
    console.log('[FileUpload] Got presigned URL, uploading to S3...')

    // Upload file to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      console.error('[FileUpload] S3 upload failed:', uploadResponse.status, uploadResponse.statusText)
      throw new Error(`Failed to upload file to S3: ${uploadResponse.statusText}`)
    }

    console.log('[FileUpload] Upload successful:', cloud_storage_path)
    setProgress(100)
    onUploadComplete(cloud_storage_path, isPublic)
  }

  const multipartUpload = async (file: File) => {
    const CHUNK_SIZE = 100 * 1024 * 1024 // 100MB chunks
    const chunks = Math.ceil(file.size / CHUNK_SIZE)

    // Initiate multipart upload
    const initiateResponse = await fetch('/api/upload/multipart/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        isPublic,
      }),
    })

    if (!initiateResponse.ok) {
      throw new Error('Failed to initiate multipart upload')
    }

    const { uploadId, cloud_storage_path } = await initiateResponse.json()

    // Upload parts
    const parts = []
    for (let i = 0; i < chunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      const partNumber = i + 1

      // Get presigned URL for part
      const partUrlResponse = await fetch('/api/upload/multipart/part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloud_storage_path,
          uploadId,
          partNumber,
        }),
      })

      if (!partUrlResponse.ok) {
        throw new Error(`Failed to get URL for part ${partNumber}`)
      }

      const { url } = await partUrlResponse.json()

      // Upload part
      const uploadPartResponse = await fetch(url, {
        method: 'PUT',
        body: chunk,
      })

      if (!uploadPartResponse.ok) {
        throw new Error(`Failed to upload part ${partNumber}`)
      }

      const etag = uploadPartResponse.headers.get('ETag')
      parts.push({ ETag: etag ?? '', PartNumber: partNumber })

      setProgress(Math.round(((i + 1) / chunks) * 100))
    }

    // Complete multipart upload
    const completeResponse = await fetch('/api/upload/multipart/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cloud_storage_path,
        uploadId,
        parts,
      }),
    })

    if (!completeResponse.ok) {
      throw new Error('Failed to complete multipart upload')
    }

    onUploadComplete(cloud_storage_path, isPublic)
  }

  const clearFile = () => {
    setFile(null)
    setError('')
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {/* Show existing file if available and no new file selected */}
        {keepExisting && existingFileName && !file && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">
                ✓ Current file: {existingFileName}
              </p>
              <p className="text-xs text-blue-600">
                Upload a new file to replace
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
        )}
        
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="cursor-pointer"
        />
        {file && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            {!uploading && !success && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {success && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
        )}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center">
              Uploading... {progress}%
            </p>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {file && !uploading && !success && (
          <Button
            type="button"
            onClick={handleUpload}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        )}
      </div>
    </div>
  )
}
