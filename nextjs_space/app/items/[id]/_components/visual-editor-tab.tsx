'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Type, Palette, Image as ImageIcon, Grid3x3, Sparkles, Save, X, Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedColorPicker } from '@/components/enhanced-color-picker';
import { LogoPicker } from '@/components/logo-picker';
import Image from 'next/image';

interface SVGLayer {
  id: string;
  type: 'group' | 'text' | 'image' | 'rect' | 'circle' | 'path' | 'unknown';
  name: string;
  children?: SVGLayer[];
  content?: string;
  fill?: string;
  stroke?: string;
}

interface LayerConfig {
  layerId: string;
  layerName: string;
  layerType: 'text' | 'graphic' | 'logo';
  value: string;
  logoIsPublic?: boolean;
}

interface Pattern {
  id: string;
  name: string;
  category: string;
  thumbnailPath?: string;
  thumbnailIsPublic?: boolean;
}

interface Embellishment {
  id: string;
  name: string;
  category: string;
  thumbnailPath?: string;
  thumbnailIsPublic?: boolean;
}

interface PatternLayer {
  id: string;
  patternId: string;
  patternName: string;
  position: string;
}

interface EmbellishmentLayer {
  id: string;
  embellishmentId: string;
  embellishmentName: string;
  position: string;
  size: number;
}

interface DesignVariant {
  id: string;
  variantName: string;
  previewSvgPath?: string;
  previewSvgIsPublic?: boolean;
  status: string;
  createdAt: string;
}

interface VisualEditorTabProps {
  itemId: string;
  templateLayerData: string | null;
  templateSvgPath: string | null;
  templateSvgIsPublic: boolean;
}

export default function VisualEditorTab({
  itemId,
  templateLayerData,
  templateSvgPath,
  templateSvgIsPublic
}: VisualEditorTabProps) {
  const [loading, setLoading] = useState(false);
  const [layers, setLayers] = useState<SVGLayer[]>([]);
  const [layerConfigs, setLayerConfigs] = useState<Record<string, LayerConfig>>({});
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [embellishments, setEmbellishments] = useState<Embellishment[]>([]);
  const [patternLayers, setPatternLayers] = useState<PatternLayer[]>([]);
  const [embellishmentLayers, setEmbellishmentLayers] = useState<EmbellishmentLayer[]>([]);
  const [originalSvg, setOriginalSvg] = useState<string>(''); // Keep original SVG
  const [previewSvg, setPreviewSvg] = useState<string>(''); // Modified SVG for preview
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [currentLogoLayerId, setCurrentLogoLayerId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [variantName, setVariantName] = useState('');
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<DesignVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [zoom, setZoom] = useState(100); // Zoom percentage

  // Helper functions
  function isLogoLayer(layer: SVGLayer): boolean {
    const logoKeywords = ['logo', 'emblem', 'badge', 'crest'];
    const layerName = layer.name.toLowerCase();
    return logoKeywords.some(keyword => layerName.includes(keyword));
  }

  function hasColorInChildren(layer: SVGLayer): boolean {
    if (layer.fill) return true;
    if (layer.children) {
      return layer.children.some(child => hasColorInChildren(child));
    }
    return false;
  }

  function getFirstFillColor(layer: SVGLayer): string | undefined {
    if (layer.fill) return layer.fill;
    if (layer.children) {
      for (const child of layer.children) {
        const color = getFirstFillColor(child);
        if (color) return color;
      }
    }
    return undefined;
  }

  // Process layers hierarchically - keep structure for cascading display
  // Only return top-level layers, keeping their children attached
  function flattenLayers(layers: SVGLayer[]): SVGLayer[] {
    const result: SVGLayer[] = [];
    
    layers.forEach(layer => {
      // For top-level groups (like Body, Inseam, etc.), include them with their children
      if (layer.type === 'group' && layer.children && layer.children.length > 0) {
        // Check if any children have fill colors (colorable)
        const hasColorableChildren = hasColorInChildren(layer);
        if (hasColorableChildren) {
          // Keep the layer with its children structure intact
          result.push(layer);
        }
      }
      // For text layers or layers with content, include them
      else if (layer.type === 'text' || layer.content) {
        result.push(layer);
      }
      // For logo layers, include them
      else if (isLogoLayer(layer)) {
        result.push(layer);
      }
      // For leaf layers with fill, include them
      else if (layer.fill && (!layer.children || layer.children.length === 0)) {
        result.push(layer);
      }
    });
    
    return result;
  }

  // Recursively initialize configs for a layer and its children
  function initializeLayerConfig(layer: SVGLayer, configs: Record<string, LayerConfig>) {
    const isTextLayer = layer.type === 'text' || layer.content;
    const isLogo = isLogoLayer(layer);
    
    let layerType: 'text' | 'graphic' | 'logo';
    let value: string;
    
    if (isLogo) {
      layerType = 'logo';
      value = '';
    } else if (isTextLayer) {
      layerType = 'text';
      value = layer.content || '';
    } else {
      layerType = 'graphic';
      value = getFirstFillColor(layer) || '#000000';
    }
    
    configs[layer.id] = {
      layerId: layer.id,
      layerName: layer.name,
      layerType,
      value,
      logoIsPublic: isLogo ? true : undefined
    };

    // Recursively initialize children
    if (layer.children && layer.children.length > 0) {
      layer.children.forEach(child => initializeLayerConfig(child, configs));
    }
  }

  // Fetch initial data
  useEffect(() => {
    if (templateLayerData) {
      try {
        const parsed = JSON.parse(templateLayerData);
        if (parsed.layers) {
          // Process layers hierarchically (keeps structure)
          const processedLayers = flattenLayers(parsed.layers);
          setLayers(processedLayers);

          // Initialize layer configurations recursively (includes all children)
          const configs: Record<string, LayerConfig> = {};
          processedLayers.forEach(layer => initializeLayerConfig(layer, configs));
          setLayerConfigs(configs);
        }
      } catch (error) {
        console.error('Failed to parse layer data:', error);
      }
    }

    fetchPatterns();
    fetchEmbellishments();
    fetchVariants();
  }, [templateLayerData, itemId]);

  // Fetch SVG preview
  useEffect(() => {
    if (templateSvgPath) {
      fetchSvgPreview();
    }
  }, [templateSvgPath]);

  // Update preview when configs change
  useEffect(() => {
    updatePreview();
  }, [layerConfigs, patternLayers, embellishmentLayers, originalSvg]);

  const fetchSvgPreview = async () => {
    try {
      let svgUrl: string;
      if (templateSvgPath.startsWith('/creator/')) {
        svgUrl = typeof window !== 'undefined' ? `${window.location.origin}${templateSvgPath}` : templateSvgPath;
      } else {
        const response = await fetch('/api/upload/file-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cloud_storage_path: templateSvgPath,
            isPublic: templateSvgIsPublic,
          }),
        });
        if (!response.ok) return;
        const { url } = await response.json();
        svgUrl = url;
      }
      const svgResponse = await fetch(svgUrl);
      const svgContent = await svgResponse.text();
      setOriginalSvg(svgContent);
      setPreviewSvg(svgContent);
    } catch (error) {
      console.error('Failed to fetch SVG preview:', error);
    }
  };

  const fetchPatterns = async () => {
    try {
      const response = await fetch('/api/patterns');
      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    }
  };

  const fetchEmbellishments = async () => {
    try {
      const response = await fetch('/api/embellishments');
      if (response.ok) {
        const data = await response.json();
        setEmbellishments(data.embellishments || []);
      }
    } catch (error) {
      console.error('Failed to fetch embellishments:', error);
    }
  };

  const fetchVariants = async () => {
    setLoadingVariants(true);
    try {
      const response = await fetch(`/api/items/${itemId}/variants`);
      if (response.ok) {
        const data = await response.json();
        setVariants(data.variants || []);
      }
    } catch (error) {
      console.error('Failed to fetch variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const updatePreview = useCallback(async () => {
    if (!originalSvg) return;

    try {
      // Always work from the original SVG to avoid cumulative changes
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
      
      // Apply layer configurations
      for (const config of Object.values(layerConfigs)) {
        // Find elements by ID
        let elements = svgDoc.querySelectorAll(`[id="${config.layerId}"]`);
        
        // Also try data-name attribute
        if (elements.length === 0) {
          elements = svgDoc.querySelectorAll(`[data-name="${config.layerId}"]`);
        }
        
        for (const element of Array.from(elements)) {
          if (config.layerType === 'text') {
            // Update text content
            if (element.tagName.toLowerCase() === 'text' || element.tagName.toLowerCase() === 'tspan') {
              element.textContent = config.value;
            }
          } else if (config.layerType === 'graphic') {
            // Update fill color for groups and their children
            const children = element.querySelectorAll('path, rect, circle, ellipse, polygon, polyline');
            if (children.length > 0) {
              // Update all children with fill colors
              children.forEach(child => {
                const currentFill = child.getAttribute('fill');
                if (currentFill && currentFill !== 'none') {
                  child.setAttribute('fill', config.value);
                }
              });
            } else {
              // Update the element itself
              const currentFill = element.getAttribute('fill');
              if (currentFill && currentFill !== 'none') {
                element.setAttribute('fill', config.value);
              }
            }
          } else if (config.layerType === 'logo' && config.value) {
            // Handle logo embedding
            try {
              // Fetch the logo URL first
              const urlResponse = await fetch('/api/upload/file-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  cloud_storage_path: config.value, 
                  isPublic: config.logoIsPublic || true
                }),
              });
              
              if (urlResponse.ok) {
                const { url: logoUrl } = await urlResponse.json();
                
                // Fetch the logo content
                const logoResponse = await fetch(logoUrl);
                const logoContent = await logoResponse.text();
                
                // Parse logo SVG
                const logoDoc = parser.parseFromString(logoContent, 'image/svg+xml');
                const logoSvg = logoDoc.querySelector('svg');
                
                if (logoSvg) {
                  // Get the bounding box of the target element (with type assertion for SVG elements)
                  let bbox = { x: 0, y: 0, width: 100, height: 100 };
                  try {
                    const svgElement = element as unknown as SVGGraphicsElement;
                    if (typeof svgElement.getBBox === 'function') {
                      bbox = svgElement.getBBox();
                    }
                  } catch (e) {
                    // Use default bbox if getBBox fails
                  }
                  
                  // Clear existing content
                  while (element.firstChild) {
                    element.removeChild(element.firstChild);
                  }
                  
                  // Create an image element to embed the logo
                  const image = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'image');
                  image.setAttribute('href', logoUrl);
                  image.setAttribute('x', bbox.x.toString());
                  image.setAttribute('y', bbox.y.toString());
                  image.setAttribute('width', bbox.width.toString());
                  image.setAttribute('height', bbox.height.toString());
                  image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                  
                  element.appendChild(image);
                }
              }
            } catch (logoError) {
              console.error('Failed to embed logo:', logoError);
            }
          }
        }
      }
      
      // Serialize back to string
      const serializer = new XMLSerializer();
      const updatedSvg = serializer.serializeToString(svgDoc);
      setPreviewSvg(updatedSvg);
    } catch (error) {
      console.error('Failed to update preview:', error);
    }
  }, [originalSvg, layerConfigs]);

  const handleLayerConfigChange = (layerId: string, value: string, logoIsPublic?: boolean) => {
    setLayerConfigs(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        value,
        ...(logoIsPublic !== undefined && { logoIsPublic })
      }
    }));
  };

  const handleLogoSelect = (layerId: string) => {
    setCurrentLogoLayerId(layerId);
    setLogoPickerOpen(true);
  };

  const handleLogoSelected = (logoPath: string, logoIsPublic: boolean) => {
    if (currentLogoLayerId) {
      handleLayerConfigChange(currentLogoLayerId, logoPath, logoIsPublic);
    }
  };

  const handleAddPattern = () => {
    const newPattern: PatternLayer = {
      id: `pattern_${Date.now()}`,
      patternId: patterns[0]?.id || '',
      patternName: patterns[0]?.name || '',
      position: 'body'
    };
    setPatternLayers(prev => [...prev, newPattern]);
  };

  const handleRemovePattern = (id: string) => {
    setPatternLayers(prev => prev.filter(p => p.id !== id));
  };

  const handleAddEmbellishment = () => {
    const newEmb: EmbellishmentLayer = {
      id: `emb_${Date.now()}`,
      embellishmentId: embellishments[0]?.id || '',
      embellishmentName: embellishments[0]?.name || '',
      position: 'chest',
      size: 100
    };
    setEmbellishmentLayers(prev => [...prev, newEmb]);
  };

  const handleRemoveEmbellishment = (id: string) => {
    setEmbellishmentLayers(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveAsVariant = async () => {
    if (!variantName.trim()) {
      toast.error('Please enter a variant name');
      return;
    }

    setSaving(true);
    try {
      // Prepare configuration
      const configuration = {
        layers: Object.values(layerConfigs).map(config => ({
          layerId: config.layerId,
          layerName: config.layerName,
          type: config.layerType,
          value: config.value,
          ...(config.logoIsPublic !== undefined && { logoIsPublic: config.logoIsPublic })
        })),
        patterns: patternLayers.map(p => ({
          patternId: p.patternId,
          position: p.position
        })),
        embellishments: embellishmentLayers.map(e => ({
          embellishmentId: e.embellishmentId,
          position: e.position,
          size: e.size
        }))
      };

      // Create variant
      const response = await fetch(`/api/items/${itemId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantName: variantName.trim(),
          configuration: JSON.stringify(configuration),
          previewSvg: previewSvg
        })
      });

      if (response.ok) {
        toast.success('Variant saved successfully!');
        setSaveDialogOpen(false);
        setVariantName('');
        fetchVariants();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save variant');
      }
    } catch (error) {
      console.error('Failed to save variant:', error);
      toast.error('Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const response = await fetch(`/api/items/${itemId}/variants/${variantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Variant deleted successfully');
        fetchVariants();
      } else {
        toast.error('Failed to delete variant');
      }
    } catch (error) {
      console.error('Failed to delete variant:', error);
      toast.error('Failed to delete variant');
    }
  };

  // Zoom control handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  // Categorize layers - Filter only top-level layers, not all nested children
  const textLayers = layers.filter(layer => layerConfigs[layer.id]?.layerType === 'text');
  const graphicLayers = layers.filter(layer => layerConfigs[layer.id]?.layerType === 'graphic');
  const logoLayers = layers.filter(layer => layerConfigs[layer.id]?.layerType === 'logo');

  return (
    <div className="space-y-6">
      {/* Split Layout: Preview (Left) + Configuration (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Preview */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Preview</span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium px-2 min-w-[50px] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomReset}
                    className="h-8 w-8 p-0"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={() => setSaveDialogOpen(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save As Variant
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-auto border">
              {previewSvg ? (
                <div 
                  className="w-full h-full p-4 flex items-center justify-center transition-transform duration-200" 
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center center'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Design Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {/* Text Layers */}
              {textLayers.length > 0 && (
                <AccordionItem value="text">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Type className="w-4 h-4 mr-2" />
                      Text Layers ({textLayers.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {textLayers.map(layer => {
                        const config = layerConfigs[layer.id];
                        if (!config) return null;
                        return (
                          <div key={layer.id} className="space-y-2">
                            <Label className="text-sm font-medium">{config.layerName}</Label>
                            <Input
                              value={config.value}
                              onChange={(e) => handleLayerConfigChange(layer.id, e.target.value)}
                              placeholder="Enter text..."
                            />
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Graphic/Color Layers */}
              {graphicLayers.length > 0 && (
                <AccordionItem value="graphics">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Palette className="w-4 h-4 mr-2" />
                      Graphic Layers ({graphicLayers.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {graphicLayers.map(layer => {
                        const config = layerConfigs[layer.id];
                        if (!config) return null;
                        return (
                          <div key={layer.id} className="space-y-2">
                            <EnhancedColorPicker
                              label={config.layerName}
                              color={config.value}
                              onChange={(color) => handleLayerConfigChange(layer.id, color)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Logo Layers */}
              {logoLayers.length > 0 && (
                <AccordionItem value="logos">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Logo Layers ({logoLayers.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {logoLayers.map(layer => {
                        const config = layerConfigs[layer.id];
                        if (!config) return null;
                        return (
                          <div key={layer.id} className="space-y-2">
                            <Label className="text-sm font-medium">{config.layerName}</Label>
                            {config.value ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 p-2 bg-gray-50 rounded border">
                                  <p className="text-xs text-gray-600 truncate">{config.value.split('/').pop()}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleLogoSelect(layer.id)}
                                >
                                  Change
                                </Button>
                              </div>
                            ) : (
                              <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => handleLogoSelect(layer.id)}
                              >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Select Logo
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Patterns */}
              <AccordionItem value="patterns">
                <AccordionTrigger>
                  <div className="flex items-center">
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Patterns ({patternLayers.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {patternLayers.map((pattern, index) => (
                      <Card key={pattern.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium">Pattern {index + 1}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemovePattern(pattern.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Pattern</Label>
                            <Select
                              value={pattern.patternId}
                              onValueChange={(value) => {
                                setPatternLayers(prev => prev.map(p => 
                                  p.id === pattern.id 
                                    ? { ...p, patternId: value, patternName: patterns.find(pt => pt.id === value)?.name || '' }
                                    : p
                                ));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {patterns.map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Position</Label>
                            <Select
                              value={pattern.position}
                              onValueChange={(value) => {
                                setPatternLayers(prev => prev.map(p => 
                                  p.id === pattern.id ? { ...p, position: value } : p
                                ));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="body">Body</SelectItem>
                                <SelectItem value="sleeve">Sleeve</SelectItem>
                                <SelectItem value="inseam">Inseam</SelectItem>
                                <SelectItem value="collar">Collar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleAddPattern}
                      disabled={patterns.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pattern
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Embellishments */}
              <AccordionItem value="embellishments">
                <AccordionTrigger>
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Embellishments ({embellishmentLayers.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {embellishmentLayers.map((emb, index) => (
                      <Card key={emb.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium">Embellishment {index + 1}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveEmbellishment(emb.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Embellishment</Label>
                            <Select
                              value={emb.embellishmentId}
                              onValueChange={(value) => {
                                setEmbellishmentLayers(prev => prev.map(e => 
                                  e.id === emb.id 
                                    ? { ...e, embellishmentId: value, embellishmentName: embellishments.find(em => em.id === value)?.name || '' }
                                    : e
                                ));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {embellishments.map(e => (
                                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Position</Label>
                            <Select
                              value={emb.position}
                              onValueChange={(value) => {
                                setEmbellishmentLayers(prev => prev.map(e => 
                                  e.id === emb.id ? { ...e, position: value } : e
                                ));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="chest">Chest</SelectItem>
                                <SelectItem value="back">Back</SelectItem>
                                <SelectItem value="sleeve">Sleeve</SelectItem>
                                <SelectItem value="collar">Collar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Size: {emb.size}%</Label>
                            <Slider
                              value={[emb.size]}
                              onValueChange={([value]) => {
                                setEmbellishmentLayers(prev => prev.map(e => 
                                  e.id === emb.id ? { ...e, size: value } : e
                                ));
                              }}
                              min={50}
                              max={200}
                              step={10}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleAddEmbellishment}
                      disabled={embellishments.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Embellishment
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Design Variants Section */}
      <Card>
        <CardHeader>
          <CardTitle>Design Variants</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVariants ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : variants.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No saved variants yet. Configure the design above and click "Save As Variant" to create one.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {variants.map(variant => (
                <Card key={variant.id} className="group relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteVariant(variant.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                      {variant.previewSvgPath ? (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          {/* Preview would be rendered here */}
                          <Badge variant="secondary">Preview</Badge>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-medium truncate">{variant.variantName}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(variant.createdAt).toLocaleDateString()}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {variant.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo Picker Dialog */}
      <LogoPicker
        open={logoPickerOpen}
        onOpenChange={(open) => {
          setLogoPickerOpen(open);
          if (!open) {
            setCurrentLogoLayerId(null);
          }
        }}
        onSelect={handleLogoSelected}
        itemId={itemId}
      />

      {/* Save Variant Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design Variant</DialogTitle>
            <DialogDescription>
              Give this design configuration a unique name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Variant Name</Label>
            <Input
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="e.g., Red Home Jersey"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsVariant} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Variant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
