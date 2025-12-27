'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/color-picker'
import { FileUpload } from '@/components/file-upload'
import { 
  ChevronRight, 
  ChevronDown, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Circle, 
  Layers, 
  Eye, 
  EyeOff 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SVGLayer {
  id: string
  type: 'group' | 'text' | 'image' | 'rect' | 'circle' | 'path' | 'unknown'
  name: string
  children?: SVGLayer[]
  attributes?: Record<string, string>
  content?: string
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  stroke?: string
  transform?: string
}

export interface LayerChange {
  layerId: string
  type: 'text' | 'fill' | 'stroke' | 'image' | 'visibility'
  value: string | boolean
}

interface LayerInspectorProps {
  layers: SVGLayer[]
  selectedLayerId?: string
  onSelectLayer: (layerId: string) => void
  onLayerChange: (change: LayerChange) => void
  changes: Record<string, LayerChange>
}

export function LayerInspector({ 
  layers, 
  selectedLayerId, 
  onSelectLayer, 
  onLayerChange,
  changes 
}: LayerInspectorProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set())

  const toggleExpanded = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }
      return next
    })
  }

  const toggleVisibility = (layerId: string) => {
    setHiddenLayers(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }
      return next
    })
    onLayerChange({ layerId, type: 'visibility', value: !hiddenLayers.has(layerId) })
  }

  const getLayerIcon = (type: SVGLayer['type']) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'rect': return <Square className="w-4 h-4" />
      case 'circle': return <Circle className="w-4 h-4" />
      case 'group': return <Layers className="w-4 h-4" />
      default: return <Square className="w-4 h-4" />
    }
  }

  const renderLayer = (layer: SVGLayer, depth = 0) => {
    const isExpanded = expandedLayers.has(layer.id)
    const isSelected = selectedLayerId === layer.id
    const isHidden = hiddenLayers.has(layer.id)
    const hasChildren = layer.children && layer.children.length > 0

    return (
      <div key={layer.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-2 px-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors",
            isSelected && "bg-blue-50 hover:bg-blue-100 border-l-2 border-blue-500",
            isHidden && "opacity-50"
          )}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => onSelectLayer(layer.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(layer.id)
              }}
              className="mr-1 hover:bg-gray-200 rounded p-1"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="mr-2">{getLayerIcon(layer.type)}</div>
          
          <span className="flex-1 text-sm font-medium truncate">{layer.name}</span>
          
          <Badge variant="outline" className="text-xs mr-2">{layer.type}</Badge>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleVisibility(layer.id)
            }}
            className="hover:bg-gray-200 rounded p-1"
          >
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {layer.children!.map(child => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const selectedLayer = findLayerById(layers, selectedLayerId || '')
  const currentChange = selectedLayerId ? changes[selectedLayerId] : null

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Layers className="w-5 h-5 mr-2" />
            Layer Inspector
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {layers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No layers found</p>
              <p className="text-sm">Upload an SVG file to see layers</p>
            </div>
          ) : (
            <div className="space-y-1">
              {layers.map(layer => renderLayer(layer))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLayer && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-md">Edit: {selectedLayer.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedLayer.type === 'text' && (
              <div>
                <Label>Text Content</Label>
                <Input
                  value={currentChange?.type === 'text' ? String(currentChange.value) : (selectedLayer.content || '')}
                  onChange={(e) => onLayerChange({ layerId: selectedLayer.id, type: 'text', value: e.target.value })}
                  placeholder="Enter text..."
                />
              </div>
            )}

            {selectedLayer.type === 'image' && (
              <div>
                <Label>Replace Image</Label>
                <FileUpload
                  label="Upload new image"
                  accept=".png,.jpg,.jpeg,.svg"
                  isPublic={false}
                  maxSize={10}
                  onUploadComplete={(path, isPublic) => onLayerChange({ layerId: selectedLayer.id, type: 'image', value: path })}
                />
              </div>
            )}

            {(selectedLayer.type === 'rect' || selectedLayer.type === 'circle' || selectedLayer.type === 'path') && (
              <>
                {selectedLayer.fill && (
                  <ColorPicker
                    label="Fill Color"
                    color={currentChange?.type === 'fill' ? String(currentChange.value) : (selectedLayer.fill || '#000000')}
                    onChange={(color) => onLayerChange({ layerId: selectedLayer.id, type: 'fill', value: color })}
                  />
                )}
                {selectedLayer.stroke && (
                  <ColorPicker
                    label="Stroke Color"
                    color={currentChange?.type === 'stroke' ? String(currentChange.value) : (selectedLayer.stroke || '#000000')}
                    onChange={(color) => onLayerChange({ layerId: selectedLayer.id, type: 'stroke', value: color })}
                  />
                )}
              </>
            )}

            <div className="pt-2 border-t">
              <Label className="text-sm text-gray-500">Layer Properties</Label>
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div><span className="font-medium">Type:</span> {selectedLayer.type}</div>
                <div><span className="font-medium">ID:</span> {selectedLayer.id}</div>
                {selectedLayer.x !== undefined && <div><span className="font-medium">X:</span> {selectedLayer.x}</div>}
                {selectedLayer.y !== undefined && <div><span className="font-medium">Y:</span> {selectedLayer.y}</div>}
                {selectedLayer.width !== undefined && <div><span className="font-medium">Width:</span> {selectedLayer.width}</div>}
                {selectedLayer.height !== undefined && <div><span className="font-medium">Height:</span> {selectedLayer.height}</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function findLayerById(layers: SVGLayer[], id: string): SVGLayer | null {
  for (const layer of layers) {
    if (layer.id === id) return layer
    if (layer.children) {
      const found = findLayerById(layer.children, id)
      if (found) return found
    }
  }
  return null
}
