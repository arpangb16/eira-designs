'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayerInspector, SVGLayer, LayerChange } from '@/components/layer-inspector'
import { RotateCcw, Save, Download } from 'lucide-react'

interface SVGEditorProps {
  svgContent: string
  layers: SVGLayer[]
  onSave?: (changes: Record<string, LayerChange>) => void
  className?: string
}

export function SVGEditor({ svgContent, layers, onSave, className }: SVGEditorProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>()
  const [changes, setChanges] = useState<Record<string, LayerChange>>({})
  const [modifiedSvg, setModifiedSvg] = useState(svgContent)
  const svgRef = useRef<HTMLDivElement>(null)

  // Apply changes to SVG
  useEffect(() => {
    if (!svgContent) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(svgContent, 'image/svg+xml')

    // Apply each change to the SVG DOM
    Object.entries(changes).forEach(([layerId, change]) => {
      const element = doc.getElementById(layerId) || doc.querySelector(`[data-name="${layerId}"]`)
      if (!element) return

      switch (change.type) {
        case 'text':
          element.textContent = String(change.value)
          break
        case 'fill':
          element.setAttribute('fill', String(change.value))
          break
        case 'stroke':
          element.setAttribute('stroke', String(change.value))
          break
        case 'visibility':
          element.setAttribute('visibility', change.value ? 'visible' : 'hidden')
          break
        case 'image':
          if (element.tagName.toLowerCase() === 'image') {
            element.setAttribute('href', String(change.value))
            element.setAttribute('xlink:href', String(change.value))
          }
          break
      }
    })

    const serializer = new XMLSerializer()
    const newSvgContent = serializer.serializeToString(doc)
    setModifiedSvg(newSvgContent)
  }, [changes, svgContent])

  const handleLayerChange = (change: LayerChange) => {
    setChanges(prev => ({
      ...prev,
      [change.layerId]: change
    }))
  }

  const handleReset = () => {
    setChanges({})
    setModifiedSvg(svgContent)
  }

  const handleSave = () => {
    if (onSave) {
      onSave(changes)
    }
  }

  const handleDownloadSvg = () => {
    const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `edited-design-${Date.now()}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* SVG Preview */}
      <div className="lg:col-span-2">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Design Preview</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadSvg}>
                <Download className="w-4 h-4 mr-2" />
                Download SVG
              </Button>
              {onSave && (
                <Button size="sm" onClick={handleSave} disabled={Object.keys(changes).length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  Apply Changes
                </Button>
              )}
            </div>
          </div>
          <div 
            ref={svgRef}
            className="w-full bg-white border rounded-lg p-4 min-h-[400px] flex items-center justify-center overflow-auto"
            dangerouslySetInnerHTML={{ __html: modifiedSvg }}
          />
          {Object.keys(changes).length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                {Object.keys(changes).length} unsaved change(s)
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Layer Inspector */}
      <div className="lg:col-span-1">
        <LayerInspector
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onLayerChange={handleLayerChange}
          changes={changes}
        />
      </div>
    </div>
  )
}
