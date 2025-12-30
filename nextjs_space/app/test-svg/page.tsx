'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, EyeOff } from 'lucide-react';

export default function TestSVGPage() {
  const [svgContent, setSvgContent] = useState('');
  const [layers, setLayers] = useState<any[]>([]);
  const [modifications, setModifications] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load the test SVG
    fetch('/api/test-svg')
      .then(res => res.text())
      .then(svg => {
        setSvgContent(svg);
        parseLayers(svg);
      });
  }, []);

  function parseLayers(svg: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const groups = doc.querySelectorAll('g[id]');
    
    const layerList: any[] = [];
    groups.forEach(g => {
      const id = g.getAttribute('id') || '';
      const textEl = g.querySelector('text');
      const visible = g.getAttribute('visibility') !== 'hidden';
      
      layerList.push({
        id,
        name: id.replace(/_/g, ' '),
        type: textEl ? 'text' : 'group',
        text: textEl?.textContent || '',
        visible
      });
    });
    
    setLayers(layerList);
  }

  function applyModifications() {
    if (!svgContent) return;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Apply each modification
    Object.entries(modifications).forEach(([layerId, mod]) => {
      const layer = doc.querySelector(`g[id="${layerId}"]`);
      if (!layer) return;
      
      if (mod.visible !== undefined) {
        if (mod.visible) {
          layer.removeAttribute('visibility');
        } else {
          layer.setAttribute('visibility', 'hidden');
        }
      }
      
      if (mod.text && mod.text.trim()) {
        const textEl = layer.querySelector('text');
        if (textEl) {
          textEl.textContent = mod.text;
        }
      }
      
      if (mod.fill) {
        const textEl = layer.querySelector('text');
        if (textEl) {
          textEl.setAttribute('fill', mod.fill);
        }
        const pathEls = layer.querySelectorAll('path, rect, circle, ellipse');
        pathEls.forEach(el => {
          el.setAttribute('fill', mod.fill);
        });
      }
    });
    
    const modifiedSvg = new XMLSerializer().serializeToString(doc);
    setSvgContent(modifiedSvg);
  }

  function downloadSVG() {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modified_singlet_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateModification(layerId: string, key: string, value: any) {
    setModifications(prev => ({
      ...prev,
      [layerId]: {
        ...(prev[layerId] || {}),
        [key]: value
      }
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">SVG → Illustrator Test Workflow</h1>
          <p className="text-gray-600 mt-2">
            Make changes to the layers below, then download the modified SVG to open in Illustrator
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SVG Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
            <div className="border-2 border-gray-300 rounded-lg bg-white p-4 overflow-auto" 
                 style={{ maxHeight: '700px' }}>
              {svgContent && (
                <div 
                  dangerouslySetInnerHTML={{ __html: svgContent }} 
                  className="flex items-center justify-center"
                />
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={applyModifications} className="flex-1">
                Apply Changes
              </Button>
              <Button onClick={downloadSVG} variant="outline" className="flex gap-2">
                <Download className="w-4 h-4" />
                Download SVG
              </Button>
            </div>
          </Card>

          {/* Layer Controls */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Layer Inspector</h2>
            <div className="space-y-4 overflow-auto" style={{ maxHeight: '700px' }}>
              {layers.map(layer => (
                <Card key={layer.id} className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={modifications[layer.id]?.visible ?? layer.visible}
                        onCheckedChange={(checked) => 
                          updateModification(layer.id, 'visible', checked)
                        }
                      />
                      <Label className="font-mono text-sm font-semibold">
                        {layer.name}
                      </Label>
                    </div>
                    {(modifications[layer.id]?.visible ?? layer.visible) ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  {layer.type === 'text' && (
                    <div className="space-y-2 mt-2">
                      <div>
                        <Label className="text-xs">Text Content</Label>
                        <Input
                          value={modifications[layer.id]?.text ?? layer.text}
                          onChange={(e) => 
                            updateModification(layer.id, 'text', e.target.value)
                          }
                          placeholder={layer.text}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Text Color</Label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={modifications[layer.id]?.fill || '#FFFFFF'}
                            onChange={(e) => 
                              updateModification(layer.id, 'fill', e.target.value)
                            }
                            className="w-12 h-9 rounded border"
                          />
                          <Input
                            value={modifications[layer.id]?.fill || '#FFFFFF'}
                            onChange={(e) => 
                              updateModification(layer.id, 'fill', e.target.value)
                            }
                            placeholder="#FFFFFF"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2">Test Workflow:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Modify layers above (toggle visibility, change text, adjust colors)</li>
            <li>Click "Apply Changes" to see updates in the preview</li>
            <li>Click "Download SVG" to save the modified file</li>
            <li>Open the downloaded SVG in Illustrator to verify layer structure</li>
            <li>Use the Bridge utility to apply these same changes to the master .ai file</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
