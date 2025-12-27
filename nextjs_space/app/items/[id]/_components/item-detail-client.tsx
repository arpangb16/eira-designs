'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SVGEditor } from '@/components/svg-editor'
import { SVGLayer, LayerChange } from '@/components/layer-inspector'
import { ArrowLeft, Sparkles, Download, FileText, Layers } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ItemDetailProps {
  item: any
}

export function ItemDetailClient({ item }: ItemDetailProps) {
  const router = useRouter()
  const [svgContent, setSvgContent] = useState<string>('')
  const [layers, setLayers] = useState<SVGLayer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})

  // Fetch SVG content and parse layers
  useEffect(() => {
    const fetchSvgData = async () => {
      if (!item.template?.svgPath) {
        setLoading(false)
        return
      }

      try {
        // Get SVG file URL
        const urlResponse = await fetch('/api/upload/file-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cloud_storage_path: item.template.svgPath, 
            isPublic: item.template.svgIsPublic ?? false 
          }),
        })
        
        if (!urlResponse.ok) throw new Error('Failed to get SVG URL')
        const { url } = await urlResponse.json()
        
        // Fetch SVG content
        const svgResponse = await fetch(url)
        const content = await svgResponse.text()
        setSvgContent(content)

        // Parse layers from template if available
        if (item.template.layerData) {
          const parsed = JSON.parse(item.template.layerData)
          setLayers(parsed.layers || [])
        }
      } catch (error) {
        console.error('Failed to fetch SVG:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSvgData()
  }, [item])

  // Fetch generated file URLs
  useEffect(() => {
    const fetchFileUrls = async () => {
      for (const file of item.generatedFiles) {
        try {
          const response = await fetch('/api/upload/file-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              cloud_storage_path: file.filePath, 
              isPublic: file.fileIsPublic 
            }),
          })
          if (response.ok) {
            const { url } = await response.json()
            setFileUrls(prev => ({ ...prev, [file.id]: url }))
          }
        } catch (error) {
          console.error('Failed to fetch file URL:', error)
        }
      }
    }

    if (item.generatedFiles?.length > 0) {
      fetchFileUrls()
    }
  }, [item.generatedFiles])

  const handleSaveChanges = async (changes: Record<string, LayerChange>) => {
    setSaving(true)
    try {
      // Create a design instruction with the structured changes
      const response = await fetch('/api/design-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          instruction: `Visual edit: ${Object.keys(changes).length} layer changes`,
          parsedData: JSON.stringify({ changes }),
          status: 'pending'
        }),
      })

      if (response.ok) {
        alert('Design changes submitted! The bridge will process them shortly.')
        router.refresh()
      } else {
        alert('Failed to save changes. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save changes:', error)
      alert('An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadFile = (fileId: string, fileName: string) => {
    const url = fileUrls[fileId]
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/items">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Items
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{item.name}</h1>
              <p className="text-lg text-gray-600">
                {item.project.team.school.name} • {item.project.team.name} • {item.project.name}
              </p>
            </div>
            <Badge className="text-lg px-4 py-2">{item.status}</Badge>
          </div>
        </div>

        {/* Template Info */}
        {item.template && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Template: {item.template.name}</CardTitle>
              <CardDescription>
                Category: {item.template.category}
                {layers.length > 0 && (
                  <span className="ml-4">
                    <Layers className="inline w-4 h-4 mr-1" />
                    {layers.length} layers available for editing
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* SVG Editor */}
        {loading ? (
          <Card className="p-12 text-center">
            <p>Loading design editor...</p>
          </Card>
        ) : !item.template?.svgPath ? (
          <Card className="p-12 text-center">
            <Layers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No SVG Preview Available</h3>
            <p className="text-gray-600 mb-4">
              This template doesn't have an SVG file. Upload an SVG to enable visual editing.
            </p>
            <p className="text-sm text-gray-500">
              You can still create design instructions using text, but you won't see a live preview.
            </p>
          </Card>
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Visual Design Editor</h2>
            <SVGEditor 
              svgContent={svgContent} 
              layers={layers}
              onSave={handleSaveChanges}
            />
          </div>
        )}

        {/* Design Instructions */}
        {item.designInstructions?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Design Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {item.designInstructions.map((instruction: any) => (
                  <div key={instruction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-gray-600">
                        {new Date(instruction.createdAt).toLocaleString()}
                      </p>
                      <Badge 
                        variant={
                          instruction.status === 'completed' ? 'default' :
                          instruction.status === 'processing' ? 'secondary' :
                          instruction.status === 'failed' ? 'destructive' : 'outline'
                        }
                      >
                        {instruction.status}
                      </Badge>
                    </div>
                    <p className="text-gray-900">{instruction.instruction}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Files */}
        {item.generatedFiles?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Generated Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {item.generatedFiles.map((file: any) => (
                  <Button
                    key={file.id}
                    variant="outline"
                    className="h-auto flex flex-col items-center p-4"
                    onClick={() => handleDownloadFile(file.id, file.fileName)}
                  >
                    <FileText className="w-8 h-8 mb-2" />
                    <span className="text-xs font-medium">{file.fileType.toUpperCase()}</span>
                    <span className="text-xs text-gray-500 truncate w-full text-center">
                      {file.fileName}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
