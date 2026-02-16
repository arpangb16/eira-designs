'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Layers, FileImage, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Template {
  id: string
  name: string
  category: string
  svgPath?: string | null
  svgIsPublic?: boolean
  layerData?: string | null
  description?: string | null
}

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: Template) => void
}

export function TemplateSelector({ open, onOpenChange, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [svgPreviews, setSvgPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
        
        // Load SVG previews for templates that have SVG
        data.forEach((template: Template) => {
          if (template.svgPath) {
            loadSvgPreview(template)
          }
        })
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSvgPreview = async (template: Template) => {
    if (!template.svgPath || svgPreviews[template.id]) return
    
    try {
      const urlResponse = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cloud_storage_path: template.svgPath, 
          isPublic: template.svgIsPublic ?? false 
        }),
      })
      
      if (urlResponse.ok) {
        const { url } = await urlResponse.json()
        const svgResponse = await fetch(url)
        const content = await svgResponse.text()
        setSvgPreviews(prev => ({ ...prev, [template.id]: content }))
      }
    } catch (error) {
      console.error('Failed to load SVG preview:', error)
    }
  }

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      template.name.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    )
  })

  const handleSelect = (template: Template) => {
    onSelect(template)
    onOpenChange(false)
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Template from Library</DialogTitle>
          <DialogDescription>
            Choose a template from your template library to add to your design
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search */}
          <Input
            placeholder="Search templates by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto text-gray-400 mb-2 animate-spin" />
                <p className="text-sm text-gray-500">Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileImage className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No templates found matching your search' : 'No templates available'}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow h-full"
                      onClick={() => handleSelect(template)}
                    >
                      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 border-b">
                        {svgPreviews[template.id] ? (
                          <div 
                            className="w-full h-full p-4 flex items-center justify-center" 
                            dangerouslySetInnerHTML={{ __html: svgPreviews[template.id] }}
                            style={{ overflow: 'hidden' }}
                          />
                        ) : template.svgPath ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Layers className="w-8 h-8 mx-auto text-gray-400 mb-2 animate-pulse" />
                              <p className="text-xs text-gray-500">Loading...</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <FileImage className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500">No preview</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                          {template.layerData && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              <Layers className="w-3 h-3 mr-1" />
                              Layers
                            </Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

