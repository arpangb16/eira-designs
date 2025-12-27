'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, FileImage, Download, Layers, FileType, Wand2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SVGEditor } from '@/components/svg-editor'
import { SVGLayer, LayerChange } from '@/components/layer-inspector'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  category: string
  filePath: string
  fileIsPublic: boolean
  svgPath: string | null
  svgIsPublic: boolean
  layerData: string | null
}

interface Project {
  id: string
  name: string
  team: {
    id: string
    name: string
    school: {
      id: string
      name: string
    }
  }
}

interface Item {
  id: string
  name: string
  status: string
  projectId: string
  templateId: string | null
  createdAt: Date
  updatedAt: Date
  project: Project
  template: Template | null
  designInstructions: any[]
  generatedFiles: any[]
}

const statuses = ['pending', 'in_progress', 'completed', 'cancelled']

export function ItemDetailClient({ 
  item, 
  projects,
  templates 
}: { 
  item: Item
  projects: Project[]
  templates: Template[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: item.name,
    projectId: item.projectId,
    templateId: item.templateId ?? '',
    status: item.status,
  })
  const [loading, setLoading] = useState(false)
  const [aiFileUrl, setAiFileUrl] = useState<string | null>(null)
  const [svgPreview, setSvgPreview] = useState<string | null>(null)
  const [svgLayers, setSvgLayers] = useState<SVGLayer[]>([])
  const [savingChanges, setSavingChanges] = useState(false)

  useEffect(() => {
    // Fetch .ai file URL
    if (item.template?.filePath) {
      fetchFileUrl(item.template.filePath, item.template.fileIsPublic, 'ai')
    }

    // Fetch SVG preview
    if (item.template?.svgPath) {
      fetchSvgPreview(item.template.svgPath, item.template.svgIsPublic)
    }
  }, [item.template])

  const fetchFileUrl = async (path: string, isPublic: boolean, type: string) => {
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: path, isPublic }),
      })
      if (response.ok) {
        const { url } = await response.json()
        if (type === 'ai') {
          setAiFileUrl(url)
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} file URL:`, error)
    }
  }

  const fetchSvgPreview = async (path: string, isPublic: boolean) => {
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: path, isPublic }),
      })
      if (response.ok) {
        const { url } = await response.json()
        // Fetch the SVG content
        const svgResponse = await fetch(url)
        const svgContent = await svgResponse.text()
        setSvgPreview(svgContent)
        
        // Parse layers from template layerData
        if (item.template?.layerData) {
          try {
            const parsed = JSON.parse(item.template.layerData)
            if (parsed.layers) {
              setSvgLayers(parsed.layers)
            }
          } catch (error) {
            console.error('Failed to parse layer data:', error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch SVG preview:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (url: string | null, filename: string) => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    link.click()
  }

  const handleSaveLayerChanges = async (changes: Record<string, LayerChange>) => {
    setSavingChanges(true)
    try {
      // Convert changes to a JSON instruction
      const instruction = JSON.stringify({
        type: 'layer_modifications',
        changes: Object.entries(changes).map(([layerId, change]) => ({
          layerId,
          changeType: change.type,
          value: change.value
        })),
        timestamp: new Date().toISOString()
      })

      const response = await fetch('/api/design-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          instruction
        }),
      })

      if (response.ok) {
        toast.success('Changes saved successfully!')
        router.refresh()
      } else {
        toast.error('Failed to save changes')
      }
    } catch (error) {
      console.error('Failed to save layer changes:', error)
      toast.error('Failed to save changes')
    } finally {
      setSavingChanges(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getLayerCount = (): number => {
    if (!item.template?.layerData) return 0
    try {
      const parsed = JSON.parse(item.template.layerData)
      return parsed?.layers?.length || 0
    } catch {
      return 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/projects/${item.project.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {item.project.name}
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{item.name}</h1>
              <p className="text-lg text-gray-600 mb-2">
                {item.project.name} • {item.project.team.name} • {item.project.team.school.name}
              </p>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                  <span className="text-sm font-medium capitalize">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                {item.template && (
                  <Badge variant="secondary">
                    Template: {item.template.name}
                  </Badge>
                )}
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Item</DialogTitle>
                  <DialogDescription>Update item information</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Item Name *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <Label>Project *</Label>
                      <Select 
                        value={formData.projectId} 
                        onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                        required
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name} ({project.team.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Template</Label>
                      <Select 
                        value={formData.templateId} 
                        onValueChange={(value) => setFormData({ ...formData, templateId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} ({template.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                        required
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Update'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Template Design Section */}
        {item.template && (
          <Tabs defaultValue="overview" className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">
                <FileImage className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="editor" disabled={!svgPreview || svgLayers.length === 0}>
                <Wand2 className="w-4 h-4 mr-2" />
                Visual Editor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SVG Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <FileImage className="w-5 h-5 mr-2" />
                        SVG Preview
                      </span>
                      {item.template.layerData && (
                        <Badge variant="outline">
                          <Layers className="w-3 h-3 mr-1" />
                          {getLayerCount()} layers
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Visual preview of the template design
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden border">
                      {svgPreview ? (
                        <div 
                          className="w-full h-full p-4 flex items-center justify-center" 
                          dangerouslySetInnerHTML={{ __html: svgPreview }}
                          style={{ overflow: 'hidden' }}
                        />
                      ) : item.template.svgPath ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Layers className="w-12 h-12 mx-auto text-gray-400 mb-2 animate-pulse" />
                            <p className="text-sm text-gray-500">Loading preview...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <FileImage className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No SVG preview available</p>
                            <p className="text-xs text-gray-400 mt-1">Upload an SVG file to enable visual editing</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI File Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileType className="w-5 h-5 mr-2" />
                      Master Template File
                    </CardTitle>
                    <CardDescription>
                      Adobe Illustrator source file for high-quality output
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.template.name}.ai</p>
                          <p className="text-sm text-gray-500">Category: {item.template.category}</p>
                        </div>
                        <Badge variant="secondary">.ai</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full mt-3"
                        onClick={() => handleDownload(aiFileUrl, `${item.template?.name}.ai`)}
                        disabled={!aiFileUrl}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download .AI File
                      </Button>
                    </div>
                    {item.template.svgPath && svgLayers.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                          <Layers className="w-4 h-4 inline mr-1" />
                          Layer Information Available
                        </p>
                        <p className="text-xs text-blue-600 mb-3">
                          This template has {getLayerCount()} editable layers that can be customized.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full bg-white"
                          onClick={() => {
                            const editorTab = document.querySelector('[value="editor"]') as HTMLElement
                            editorTab?.click()
                          }}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Open Visual Editor
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="editor" className="mt-6">
              {svgPreview && svgLayers.length > 0 ? (
                <SVGEditor
                  svgContent={svgPreview}
                  layers={svgLayers}
                  onSave={handleSaveLayerChanges}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Layers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No SVG layers available</h3>
                    <p className="text-gray-600">
                      Upload an SVG file with named layers to use the visual editor
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!item.template && (
          <Card className="mb-6">
            <CardContent className="text-center py-12">
              <FileImage className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No template assigned</h3>
              <p className="text-gray-600 mb-4">Assign a template to this item to view and edit the design files</p>
              <Button onClick={() => setOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Item
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Design Instructions and Generated Files */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Instructions</CardTitle>
              <CardDescription>
                {item.designInstructions.length} instruction{item.designInstructions.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {item.designInstructions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No design instructions yet</p>
              ) : (
                <div className="space-y-2">
                  {item.designInstructions.map((instruction: any) => (
                    <div key={instruction.id} className="p-3 bg-gray-50 rounded border text-sm">
                      <pre className="whitespace-pre-wrap break-words">{instruction.instruction}</pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Files</CardTitle>
              <CardDescription>
                {item.generatedFiles.length} file{item.generatedFiles.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {item.generatedFiles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No generated files yet</p>
              ) : (
                <div className="space-y-2">
                  {item.generatedFiles.map((file: any) => (
                    <div key={file.id} className="p-3 bg-gray-50 rounded border flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.format.toUpperCase()}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">{file.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
