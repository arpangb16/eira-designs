'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layers, Type, Palette, Save, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Layer {
  id: string
  name: string
  type: 'text' | 'rect' | 'circle' | 'path' | 'image'
  text?: string
  fill?: string
  stroke?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

interface TemplateLayerEditorProps {
  template: {
    id: string
    name: string
    svgPath?: string | null
    svgIsPublic?: boolean
    layerData?: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (layerData: string) => Promise<void>
}

export function TemplateLayerEditor({ template, open, onOpenChange, onSave }: TemplateLayerEditorProps) {
  const { toast } = useToast()
  const [layers, setLayers] = useState<Layer[]>([])
  const [svgContent, setSvgContent] = useState<string>('')
  const [modifiedSvg, setModifiedSvg] = useState<string>('')
  const [modifications, setModifications] = useState<Record<string, { text?: string; fill?: string; stroke?: string }>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load SVG and layer data
  useEffect(() => {
    if (open && template.svgPath && template.layerData) {
      loadTemplateData()
    }
  }, [open, template.svgPath, template.layerData])

  const loadTemplateData = async () => {
    setLoading(true)
    try {
      // Fetch SVG content
      if (template.svgPath) {
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
          setSvgContent(content)
          setModifiedSvg(content)
        }
      }

      // Parse layer data
      if (template.layerData) {
        const parsed = JSON.parse(template.layerData)
        setLayers(parsed.layers || [])
      }
    } catch (error) {
      console.error('Failed to load template data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load template data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Apply modifications to SVG
  useEffect(() => {
    if (!svgContent || layers.length === 0) return

    let modified = svgContent

    // Apply text changes
    Object.entries(modifications).forEach(([layerId, mods]) => {
      const layer = layers.find(l => l.id === layerId)
      if (!layer) return

      if (layer.type === 'text' && mods.text !== undefined) {
        // Replace text content - handle both self-closing and with content
        const textRegex = new RegExp(`(<text[^>]*id=["']${layerId}["'][^>]*>)([^<]*)(</text>)`, 'gi')
        if (textRegex.test(modified)) {
          modified = modified.replace(textRegex, (match, openTag, oldText, closeTag) => {
            return openTag + mods.text + closeTag
          })
        } else {
          // Try to find text element and replace content between tags
          const textElementRegex = new RegExp(`(<text[^>]*id=["']${layerId}["'][^>]*>)(.*?)(</text>)`, 'gis')
          modified = modified.replace(textElementRegex, `$1${mods.text}$3`)
        }
      }

      // Apply fill color changes
      if (mods.fill !== undefined) {
        // First try to replace existing fill attribute
        const fillRegex = new RegExp(`(<[^>]*id=["']${layerId}["'][^>]*\\s)fill=["']([^"']*)["']`, 'gi')
        if (fillRegex.test(modified)) {
          modified = modified.replace(fillRegex, `$1fill="${mods.fill}"`)
        } else {
          // If no fill attribute exists, add it before the closing >
          const elementRegex = new RegExp(`(<[^>]*id=["']${layerId}["'][^>]*)(>)`, 'gi')
          modified = modified.replace(elementRegex, `$1 fill="${mods.fill}"$2`)
        }
      }

      // Apply stroke color changes
      if (mods.stroke !== undefined) {
        // First try to replace existing stroke attribute
        const strokeRegex = new RegExp(`(<[^>]*id=["']${layerId}["'][^>]*\\s)stroke=["']([^"']*)["']`, 'gi')
        if (strokeRegex.test(modified)) {
          modified = modified.replace(strokeRegex, `$1stroke="${mods.stroke}"`)
        } else {
          // If no stroke attribute exists, add it before the closing >
          const elementRegex = new RegExp(`(<[^>]*id=["']${layerId}["'][^>]*)(>)`, 'gi')
          modified = modified.replace(elementRegex, `$1 stroke="${mods.stroke}"$2`)
        }
      }
    })

    setModifiedSvg(modified)
  }, [svgContent, layers, modifications])

  const updateModification = (layerId: string, field: 'text' | 'fill' | 'stroke', value: string) => {
    setModifications(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Create updated layer data with modifications
      const updatedLayers = layers.map(layer => {
        const mods = modifications[layer.id] || {}
        return {
          ...layer,
          text: mods.text !== undefined ? mods.text : layer.text,
          fill: mods.fill !== undefined ? mods.fill : layer.fill,
          stroke: mods.stroke !== undefined ? mods.stroke : layer.stroke,
        }
      })

      const updatedLayerData = JSON.stringify({
        layers: updatedLayers,
        svgContent: modifiedSvg,
      })

      await onSave(updatedLayerData)
      
      toast({
        title: 'Success',
        description: 'Layer changes saved successfully!',
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save layer changes:', error)
      toast({
        title: 'Error',
        description: 'Failed to save layer changes',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const textLayers = layers.filter(l => l.type === 'text')
  const graphicLayers = layers.filter(l => l.type !== 'text' && (l.fill || l.stroke))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Edit Layers: {template.name}
          </DialogTitle>
          <DialogDescription>
            Edit text and colors for each layer. Changes are previewed in real-time.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Layers className="w-12 h-12 mx-auto text-gray-400 mb-2 animate-pulse" />
              <p className="text-sm text-gray-500">Loading template data...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            {/* Left: Layer Editor */}
            <ScrollArea className="pr-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <Type className="w-4 h-4 mr-2" />
                    Text ({textLayers.length})
                  </TabsTrigger>
                  <TabsTrigger value="colors">
                    <Palette className="w-4 h-4 mr-2" />
                    Colors ({graphicLayers.length})
                  </TabsTrigger>
                </TabsList>

                {/* Text Layers Tab */}
                <TabsContent value="text" className="space-y-4 mt-4">
                  {textLayers.length > 0 ? (
                    textLayers.map(layer => (
                      <Card key={layer.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{layer.name || layer.id}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Label>Text Content</Label>
                            <Input
                              value={modifications[layer.id]?.text ?? layer.text ?? ''}
                              onChange={(e) => updateModification(layer.id, 'text', e.target.value)}
                              placeholder="Enter text..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-gray-500">
                        No text layers found
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Color Layers Tab */}
                <TabsContent value="colors" className="space-y-4 mt-4">
                  {graphicLayers.length > 0 ? (
                    graphicLayers.map(layer => (
                      <Card key={layer.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{layer.name || layer.id}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {layer.fill && (
                            <div className="space-y-2">
                              <Label>Fill Color</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={modifications[layer.id]?.fill ?? layer.fill ?? '#000000'}
                                  onChange={(e) => updateModification(layer.id, 'fill', e.target.value)}
                                  className="w-12 h-10 rounded border"
                                />
                                <Input
                                  value={modifications[layer.id]?.fill ?? layer.fill ?? '#000000'}
                                  onChange={(e) => updateModification(layer.id, 'fill', e.target.value)}
                                  placeholder="#000000"
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          )}
                          {layer.stroke && (
                            <div className="space-y-2">
                              <Label>Stroke Color</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={modifications[layer.id]?.stroke ?? layer.stroke ?? '#000000'}
                                  onChange={(e) => updateModification(layer.id, 'stroke', e.target.value)}
                                  className="w-12 h-10 rounded border"
                                />
                                <Input
                                  value={modifications[layer.id]?.stroke ?? layer.stroke ?? '#000000'}
                                  onChange={(e) => updateModification(layer.id, 'stroke', e.target.value)}
                                  placeholder="#000000"
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-gray-500">
                        No color layers found
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>

            {/* Right: Preview */}
            <div className="border-l pl-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>See your changes in real-time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="w-full border rounded-lg p-4 bg-white"
                    style={{ maxHeight: '600px', overflow: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: modifiedSvg }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving || layers.length === 0}>
            {saving ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

