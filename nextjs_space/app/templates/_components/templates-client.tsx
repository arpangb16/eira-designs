'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/file-upload'
import { Plus, FileImage, Trash2, Edit, Download, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Template {
  id: string
  name: string
  category: string
  filePath: string
  fileIsPublic: boolean
  svgPath?: string | null
  svgIsPublic?: boolean
  layerData?: string | null
  description: string | null
  _count: { items: number }
}

const categories = ['t-shirts', 'shorts', 'jerseys', 'hoodies', 'jackets', 'other']

export function TemplatesClient({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    category: 't-shirts', 
    filePath: '', 
    fileIsPublic: false, 
    svgPath: '', 
    svgIsPublic: false, 
    layerData: '', 
    description: '' 
  })
  const [loading, setLoading] = useState(false)
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [svgPreviews, setSvgPreviews] = useState<Record<string, string>>({})
  const [parsingSvg, setParsingSvg] = useState(false)

  const fetchFileUrl = async (template: Template) => {
    if (!template?.filePath || fileUrls[template.id]) return
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: template.filePath, isPublic: template.fileIsPublic }),
      })
      if (response.ok) {
        const { url } = await response.json()
        setFileUrls((prev) => ({ ...prev, [template.id]: url }))
      }
    } catch (error) {
      console.error('Failed to fetch file URL:', error)
    }
  }

  const fetchSvgPreview = async (template: Template) => {
    if (!template?.svgPath || svgPreviews[template.id]) return
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: template.svgPath, isPublic: template.svgIsPublic ?? false }),
      })
      if (response.ok) {
        const { url } = await response.json()
        // Fetch the SVG content
        const svgResponse = await fetch(url)
        const svgContent = await svgResponse.text()
        setSvgPreviews((prev) => ({ ...prev, [template.id]: svgContent }))
      }
    } catch (error) {
      console.error('Failed to fetch SVG preview:', error)
    }
  }

  useEffect(() => {
    templates.forEach((template) => {
      if (template?.filePath) fetchFileUrl(template)
      if (template?.svgPath) fetchSvgPreview(template)
    })
  }, [templates])

  const handleSvgUpload = async (cloud_storage_path: string, isPublic: boolean) => {
    setParsingSvg(true)
    console.log('[Templates] Starting SVG upload process:', { cloud_storage_path, isPublic })
    
    try {
      // Step 1: Get the file URL from S3
      console.log('[Templates] Step 1: Fetching file URL...')
      const urlResponse = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path, isPublic }),
      })
      
      if (!urlResponse.ok) {
        const errorData = await urlResponse.json()
        console.error('[Templates] Failed to get file URL:', errorData)
        throw new Error(`Failed to get file URL: ${errorData.error}`)
      }
      
      const { url } = await urlResponse.json()
      console.log('[Templates] Got file URL successfully')
      
      // Step 2: Fetch the SVG content from S3
      console.log('[Templates] Step 2: Fetching SVG content from S3...')
      const svgResponse = await fetch(url)
      
      if (!svgResponse.ok) {
        console.error('[Templates] Failed to fetch SVG from S3:', svgResponse.status, svgResponse.statusText)
        throw new Error(`Failed to fetch SVG from S3: ${svgResponse.statusText}`)
      }
      
      const svgContent = await svgResponse.text()
      console.log('[Templates] SVG content fetched, length:', svgContent.length)
      
      // Step 3: Parse the SVG to extract layers
      console.log('[Templates] Step 3: Parsing SVG layers...')
      const parseResponse = await fetch('/api/templates/parse-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svgContent }),
      })
      
      if (!parseResponse.ok) {
        const errorData = await parseResponse.json()
        console.error('[Templates] Failed to parse SVG:', errorData)
        // Still save the SVG even if parsing fails
        console.log('[Templates] Saving SVG without layer data due to parsing error')
        setFormData(prev => ({ 
          ...prev, 
          svgPath: cloud_storage_path, 
          svgIsPublic: isPublic,
          layerData: ''
        }))
        return
      }
      
      const { parsed } = await parseResponse.json()
      console.log('[Templates] SVG parsed successfully, layers found:', parsed?.layers?.length || 0)
      
      setFormData(prev => ({ 
        ...prev, 
        svgPath: cloud_storage_path, 
        svgIsPublic: isPublic,
        layerData: JSON.stringify(parsed)
      }))
      console.log('[Templates] SVG upload process completed successfully')
    } catch (error) {
      console.error('[Templates] SVG upload process failed:', error)
      // Still save the SVG path even if processing fails
      setFormData(prev => ({ 
        ...prev, 
        svgPath: cloud_storage_path, 
        svgIsPublic: isPublic,
        layerData: ''
      }))
    } finally {
      setParsingSvg(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates'
      const method = editingTemplate ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setOpen(false)
        setEditingTemplate(null)
        setFormData({ name: '', category: 't-shirts', filePath: '', fileIsPublic: false, svgPath: '', svgIsPublic: false, layerData: '', description: '' })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({ 
      name: template.name, 
      category: template.category, 
      filePath: template.filePath, 
      fileIsPublic: template.fileIsPublic, 
      svgPath: template.svgPath ?? '',
      svgIsPublic: template.svgIsPublic ?? false,
      layerData: template.layerData ?? '',
      description: template.description ?? '' 
    })
    setOpen(true)
  }

  const handleDownload = (template: Template) => {
    const url = fileUrls[template.id]
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.click()
  }

  const getLayerCount = (template: Template): number => {
    if (!template.layerData) return 0
    try {
      const parsed = JSON.parse(template.layerData)
      return parsed?.layers?.length || 0
    } catch {
      return 0
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Templates</h1>
            <p className="text-lg text-gray-600">Manage .ai template files with SVG previews</p>
          </div>
          <Dialog open={open} onOpenChange={(open) => {
            if (!open) { 
              setEditingTemplate(null)
              setFormData({ name: '', category: 't-shirts', filePath: '', fileIsPublic: false, svgPath: '', svgIsPublic: false, layerData: '', description: '' }) 
            }
            setOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button size="lg"><Plus className="w-5 h-5 mr-2" />Add Template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>
                <DialogDescription>{editingTemplate ? 'Update template information' : 'Upload a new .ai template file with optional SVG preview'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Template Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Basic T-Shirt Design" required />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Describe this template..." />
                  </div>
                  <div className="border-t pt-4">
                    <Label className="text-lg font-semibold">Files</Label>
                    <p className="text-sm text-gray-500 mb-4">Upload the master .ai file (required) and an SVG file (optional) for layer preview</p>
                    
                    <FileUpload 
                      label=".AI Template File (Required)" 
                      accept=".ai,application/postscript,application/illustrator" 
                      isPublic={false} 
                      maxSize={500}
                      existingFileName={editingTemplate?.filePath ? editingTemplate.filePath.split('/').pop() : null}
                      existingFilePath={editingTemplate?.filePath || null}
                      onUploadComplete={(cloud_storage_path, isPublic) => setFormData({ ...formData, filePath: cloud_storage_path, fileIsPublic: isPublic })} 
                    />
                    
                    <div className="mt-4">
                      <FileUpload 
                        label="SVG Preview File (Optional - for layer editing)" 
                        accept=".svg,image/svg+xml" 
                        isPublic={false} 
                        maxSize={50}
                        existingFileName={editingTemplate?.svgPath ? editingTemplate.svgPath.split('/').pop() : null}
                        existingFilePath={editingTemplate?.svgPath || null}
                        onUploadComplete={handleSvgUpload} 
                      />
                      {parsingSvg && <p className="text-sm text-blue-600 mt-2">⏳ Parsing SVG layers...</p>}
                      {formData.layerData && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700 flex items-center">
                            <Layers className="w-4 h-4 mr-2" />
                            SVG uploaded and {JSON.parse(formData.layerData)?.layers?.length || 0} layers detected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading || !formData.filePath}>{loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {templates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileImage className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No templates yet</h3>
              <p className="text-gray-600 mb-4">Upload your first .ai template with an SVG preview</p>
              <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Template</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 border-b">
                    {svgPreviews[template.id] ? (
                      <div 
                        className="w-full h-full p-4 flex items-center justify-center" 
                        dangerouslySetInnerHTML={{ __html: svgPreviews[template.id] }}
                        style={{ overflow: 'hidden' }}
                      />
                    ) : template?.svgPath ? (
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
                          <p className="text-sm text-gray-500">No SVG preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="flex-1">{template.name}</span>
                      <Badge variant="secondary">{template._count?.items ?? 0}</Badge>
                    </CardTitle>
                    <CardDescription>
                      <Badge className="mb-2">{template.category}</Badge>
                      {template?.svgPath && (
                        <Badge variant="outline" className="ml-2 mb-2">
                          <Layers className="w-3 h-3 mr-1" />
                          {getLayerCount(template)} layers
                        </Badge>
                      )}
                      {template?.description && <p className="text-sm mt-2">{template.description}</p>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(template)}>
                        <Edit className="w-4 h-4 mr-2" />Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(template)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  )
}
