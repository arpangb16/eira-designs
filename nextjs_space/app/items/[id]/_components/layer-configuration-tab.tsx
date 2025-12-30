'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Layers, Type, Palette, AlertCircle, Grid3x3, Image as ImageIcon, Plus, X, Upload } from 'lucide-react';
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

interface ParsedSVG {
  layers: SVGLayer[];
  width?: number;
  height?: number;
  viewBox?: string;
}

interface Pattern {
  id: string;
  name: string;
  category: string;
}

interface Embellishment {
  id: string;
  name: string;
  category: string;
}

interface LayerConfig {
  layerId: string;
  layerName: string;
  layerType: 'text' | 'graphic' | 'logo';
  value: string; // text content, hex color, or logo path
  logoIsPublic?: boolean; // For logo layers
}

interface AdditionalLayer {
  id: string;
  type: 'pattern' | 'embellishment';
  resourceId: string;
  resourceName: string;
  position?: string; // e.g., 'body', 'sleeve', 'chest'
  size?: number; // 50-200% for embellishments
}

interface LayerConfigurationTabProps {
  itemId: string;
  templateLayerData: string | null;
  onVariantsGenerated: () => void;
}

export default function LayerConfigurationTab({ 
  itemId, 
  templateLayerData,
  onVariantsGenerated 
}: LayerConfigurationTabProps) {
  const [loading, setLoading] = useState(false);
  const [layers, setLayers] = useState<SVGLayer[]>([]);
  const [layerConfigs, setLayerConfigs] = useState<Record<string, LayerConfig>>({});
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [embellishments, setEmbellishments] = useState<Embellishment[]>([]);
  const [additionalLayers, setAdditionalLayers] = useState<AdditionalLayer[]>([]);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [currentLogoLayerId, setCurrentLogoLayerId] = useState<string | null>(null);

  // Check if a layer is a logo layer based on its name
  function isLogoLayer(layer: SVGLayer): boolean {
    const logoKeywords = ['logo', 'emblem', 'badge', 'crest'];
    const layerName = layer.name.toLowerCase();
    return logoKeywords.some(keyword => layerName.includes(keyword));
  }

  // Check if a layer or its children have fill colors
  function hasColorInChildren(layer: SVGLayer): boolean {
    if (layer.fill) return true;
    if (layer.children) {
      return layer.children.some(child => hasColorInChildren(child));
    }
    return false;
  }
  
  // Get the first fill color from a layer or its children
  function getFirstFillColor(layer: SVGLayer): string {
    if (layer.fill) return layer.fill;
    if (layer.children) {
      for (const child of layer.children) {
        const fill = getFirstFillColor(child);
        if (fill) return fill;
      }
    }
    return '#000000'; // default
  }

  // Flatten nested layers - keep top-level meaningful layers
  function flattenLayers(layers: SVGLayer[]): SVGLayer[] {
    const result: SVGLayer[] = [];
    
    layers.forEach(layer => {
      // For top-level groups (like Body, Inseam, etc.), include them
      // These are the meaningful layers users want to configure
      if (layer.type === 'group' && layer.children && layer.children.length > 0) {
        // Check if any children have fill colors (colorable)
        const hasColorableChildren = hasColorInChildren(layer);
        if (hasColorableChildren) {
          result.push(layer);
        }
      }
      // For text layers or layers with content, include them
      else if (layer.type === 'text' || layer.content) {
        result.push(layer);
      }
      // For leaf layers with fill, include them
      else if (layer.fill && (!layer.children || layer.children.length === 0)) {
        result.push(layer);
      }
    });
    
    return result;
  }

  // Parse template layers
  useEffect(() => {
    if (templateLayerData) {
      try {
        const parsed: ParsedSVG = JSON.parse(templateLayerData);
        console.log('[LayerConfig] Parsed layers:', parsed);
        
        // Flatten layers (including nested ones)
        const flattenedLayers = flattenLayers(parsed.layers);
        setLayers(flattenedLayers);
        
        // Initialize layer configurations
        const initialConfigs: Record<string, LayerConfig> = {};
        flattenedLayers.forEach(layer => {
          const isTextLayer = layer.type === 'text' || layer.content;
          const isLogo = isLogoLayer(layer);
          
          let layerType: 'text' | 'graphic' | 'logo';
          let value: string;
          
          if (isLogo) {
            layerType = 'logo';
            value = ''; // No logo selected initially
          } else if (isTextLayer) {
            layerType = 'text';
            value = layer.content || '';
          } else {
            layerType = 'graphic';
            value = getFirstFillColor(layer);
          }
          
          initialConfigs[layer.id] = {
            layerId: layer.id,
            layerName: layer.name,
            layerType,
            value,
            logoIsPublic: isLogo ? true : undefined
          };
        });
        setLayerConfigs(initialConfigs);
        console.log('[LayerConfig] Initialized configs:', initialConfigs);
      } catch (error) {
        console.error('[LayerConfig] Failed to parse layer data:', error);
        toast.error('Failed to parse template layers');
      }
    }
  }, [templateLayerData]);

  // Fetch patterns and embellishments
  useEffect(() => {
    async function fetchLibraries() {
      try {
        const [patternsRes, embellishmentsRes] = await Promise.all([
          fetch('/api/patterns'),
          fetch('/api/embellishments'),
        ]);

        if (patternsRes.ok) {
          const data = await patternsRes.json();
          setPatterns(data.patterns || []);
        }
        if (embellishmentsRes.ok) {
          const data = await embellishmentsRes.json();
          setEmbellishments(data.embellishments || []);
        }
      } catch (error) {
        console.error('[LayerConfig] Error fetching libraries:', error);
      }
    }

    fetchLibraries();
  }, []);

  // Update layer configuration
  function updateLayerConfig(layerId: string, value: string, logoIsPublic?: boolean) {
    setLayerConfigs(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        value,
        ...(logoIsPublic !== undefined && { logoIsPublic })
      }
    }));
  }

  // Open logo picker for a specific layer
  function openLogoPicker(layerId: string) {
    setCurrentLogoLayerId(layerId);
    setLogoPickerOpen(true);
  }

  // Handle logo selection from picker
  function handleLogoSelected(logoPath: string, logoIsPublic: boolean) {
    if (currentLogoLayerId) {
      updateLayerConfig(currentLogoLayerId, logoPath, logoIsPublic);
      toast.success('Logo selected successfully');
    }
  }

  // Add pattern layer
  function addPatternLayer(patternId: string) {
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;

    const newLayer: AdditionalLayer = {
      id: `pattern_${Date.now()}`,
      type: 'pattern',
      resourceId: patternId,
      resourceName: pattern.name,
      position: 'body'
    };
    setAdditionalLayers(prev => [...prev, newLayer]);
    toast.success(`Pattern "${pattern.name}" added`);
  }

  // Add embellishment layer
  function addEmbellishmentLayer(embellishmentId: string) {
    const embellishment = embellishments.find(e => e.id === embellishmentId);
    if (!embellishment) return;

    const newLayer: AdditionalLayer = {
      id: `embellishment_${Date.now()}`,
      type: 'embellishment',
      resourceId: embellishmentId,
      resourceName: embellishment.name,
      position: 'chest',
      size: 100
    };
    setAdditionalLayers(prev => [...prev, newLayer]);
    toast.success(`Embellishment "${embellishment.name}" added`);
  }

  // Remove additional layer
  function removeAdditionalLayer(layerId: string) {
    setAdditionalLayers(prev => prev.filter(layer => layer.id !== layerId));
    toast.success('Layer removed');
  }

  // Update additional layer property
  function updateAdditionalLayer(layerId: string, updates: Partial<AdditionalLayer>) {
    setAdditionalLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }

  // Generate variants
  const handleGenerateVariants = async () => {
    setLoading(true);
    try {
      // Convert layer configs to array
      const layerModifications = Object.values(layerConfigs).map(config => ({
        layerId: config.layerId,
        layerName: config.layerName,
        type: config.layerType,
        value: config.value
      }));

      // Extract patterns and embellishments from additional layers
      const patternsToAdd = additionalLayers
        .filter(layer => layer.type === 'pattern')
        .map(layer => ({
          patternId: layer.resourceId,
          position: layer.position || 'body'
        }));

      const embellishmentsToAdd = additionalLayers
        .filter(layer => layer.type === 'embellishment')
        .map(layer => ({
          embellishmentId: layer.resourceId,
          position: layer.position || 'chest',
          size: layer.size || 100
        }));

      const config = {
        layers: layerModifications,
        patterns: patternsToAdd,
        embellishments: embellishmentsToAdd,
      };

      console.log('[LayerConfig] Generating variants with config:', config);

      const response = await fetch(`/api/items/${itemId}/variants/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate variants');
      }

      toast.success(data.message || 'Variants generated successfully!');
      onVariantsGenerated();
    } catch (error) {
      console.error('[LayerConfig] Error generating variants:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate variants');
    } finally {
      setLoading(false);
    }
  };

  // Group layers by type
  const textLayers = layers.filter(layer => 
    layerConfigs[layer.id]?.layerType === 'text'
  );
  const graphicLayers = layers.filter(layer => 
    layerConfigs[layer.id]?.layerType === 'graphic'
  );
  const logoLayers = layers.filter(layer => 
    layerConfigs[layer.id]?.layerType === 'logo'
  );

  if (!templateLayerData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This template doesn't have layer data. Please upload an SVG file with proper layer structure in the Templates page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (layers.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Loading template layers...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Layers className="h-4 w-4" />
        <AlertDescription>
          Configure each layer below. Text layers allow you to edit text, graphic layers allow you to change colors.
          You can add patterns and embellishments later.
        </AlertDescription>
      </Alert>

      {/* Text Layers Section */}
      {textLayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Text Layers ({textLayers.length})
            </CardTitle>
            <CardDescription>Edit text content for each layer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {textLayers.map(layer => {
              const config = layerConfigs[layer.id];
              if (!config) return null;

              return (
                <div key={layer.id} className="space-y-2">
                  <Label htmlFor={`text-${layer.id}`}>
                    {config.layerName}
                    <span className="ml-2 text-xs text-muted-foreground">({layer.id})</span>
                  </Label>
                  <Input
                    id={`text-${layer.id}`}
                    value={config.value}
                    onChange={(e) => updateLayerConfig(layer.id, e.target.value)}
                    placeholder="Enter text..."
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Graphic Layers Section */}
      {graphicLayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Graphic Layers ({graphicLayers.length})
            </CardTitle>
            <CardDescription>Change colors for each layer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {graphicLayers.map(layer => {
              const config = layerConfigs[layer.id];
              if (!config) return null;

              return (
                <div key={layer.id} className="space-y-2">
                  <EnhancedColorPicker
                    label={config.layerName}
                    color={config.value}
                    onChange={(color) => updateLayerConfig(layer.id, color)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Logo Layers Section */}
      {logoLayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo Layers ({logoLayers.length})
            </CardTitle>
            <CardDescription>Upload or select logos from your library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoLayers.map(layer => {
              const config = layerConfigs[layer.id];
              if (!config) return null;

              return (
                <LogoLayerControl
                  key={layer.id}
                  config={config}
                  onSelectLogo={() => openLogoPicker(layer.id)}
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Patterns Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            Patterns ({additionalLayers.filter(l => l.type === 'pattern').length})
          </CardTitle>
          <CardDescription>Add pattern layers to overlay on your design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pattern Selection */}
          {patterns.length > 0 ? (
            <div className="flex gap-2">
              <Select onValueChange={addPatternLayer}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select pattern to add..." />
                </SelectTrigger>
                <SelectContent>
                  {patterns.map((pattern) => (
                    <SelectItem key={pattern.id} value={pattern.id}>
                      {pattern.name} ({pattern.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No patterns available. Add patterns from the Patterns page (right sidebar) first.
            </p>
          )}

          {/* Added Patterns */}
          {additionalLayers.filter(l => l.type === 'pattern').map(layer => (
            <Card key={layer.id} className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{layer.resourceName}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdditionalLayer(layer.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Position/Area</Label>
                  <Select 
                    value={layer.position} 
                    onValueChange={(value) => updateAdditionalLayer(layer.id, { position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="body">Body</SelectItem>
                      <SelectItem value="sleeve">Sleeve</SelectItem>
                      <SelectItem value="inseam">Inseam</SelectItem>
                      <SelectItem value="collar">Collar</SelectItem>
                      <SelectItem value="cuff">Cuff</SelectItem>
                      <SelectItem value="full">Full (All Over)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Embellishments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Embellishments ({additionalLayers.filter(l => l.type === 'embellishment').length})
          </CardTitle>
          <CardDescription>Add embellishment layers (logos, graphics, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Embellishment Selection */}
          {embellishments.length > 0 ? (
            <div className="flex gap-2">
              <Select onValueChange={addEmbellishmentLayer}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select embellishment to add..." />
                </SelectTrigger>
                <SelectContent>
                  {embellishments.map((embellishment) => (
                    <SelectItem key={embellishment.id} value={embellishment.id}>
                      {embellishment.name} ({embellishment.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No embellishments available. Add embellishments from the Embellishments page (right sidebar) first.
            </p>
          )}

          {/* Added Embellishments */}
          {additionalLayers.filter(l => l.type === 'embellishment').map(layer => (
            <Card key={layer.id} className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{layer.resourceName}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdditionalLayer(layer.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Position</Label>
                  <Select 
                    value={layer.position} 
                    onValueChange={(value) => updateAdditionalLayer(layer.id, { position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chest">Chest</SelectItem>
                      <SelectItem value="back">Back</SelectItem>
                      <SelectItem value="sleeve_left">Left Sleeve</SelectItem>
                      <SelectItem value="sleeve_right">Right Sleeve</SelectItem>
                      <SelectItem value="front_center">Front Center</SelectItem>
                      <SelectItem value="collar">Collar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Size: {layer.size}%</Label>
                  </div>
                  <Slider
                    value={[layer.size || 100]}
                    onValueChange={([value]) => updateAdditionalLayer(layer.id, { size: value })}
                    min={50}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleGenerateVariants} 
          disabled={loading} 
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Variants
            </>
          )}
        </Button>
      </div>

      {/* Logo Picker Dialog */}
      {currentLogoLayerId && (
        <LogoPicker
          open={logoPickerOpen}
          onOpenChange={setLogoPickerOpen}
          onSelect={handleLogoSelected}
          itemId={itemId}
          currentLogoPath={layerConfigs[currentLogoLayerId]?.value || null}
        />
      )}
    </div>
  );
}

// Logo Layer Control Component
interface LogoLayerControlProps {
  config: LayerConfig;
  onSelectLogo: () => void;
}

function LogoLayerControl({ config, onSelectLogo }: LogoLayerControlProps) {
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (config.value && config.logoIsPublic !== undefined) {
      loadLogoPreview();
    }
  }, [config.value, config.logoIsPublic]);

  const loadLogoPreview = async () => {
    if (!config.value) return;
    
    setLoadingPreview(true);
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cloud_storage_path: config.value, 
          isPublic: config.logoIsPublic 
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setLogoPreviewUrl(data.url);
      }
    } catch (error) {
      console.error('Failed to load logo preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {config.layerName}
        <span className="ml-2 text-xs text-muted-foreground">({config.layerId})</span>
      </Label>
      
      <div className="flex items-center gap-3">
        {/* Logo Preview */}
        {config.value ? (
          <div className="relative w-24 h-24 border-2 border-border rounded-lg overflow-hidden bg-muted">
            {loadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : logoPreviewUrl ? (
              <Image
                src={logoPreviewUrl}
                alt={config.layerName}
                fill
                className="object-contain p-2"
                sizes="96px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Select/Change Button */}
        <Button 
          variant="outline" 
          onClick={onSelectLogo}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          {config.value ? 'Change Logo' : 'Select Logo'}
        </Button>
      </div>

      {config.value && (
        <p className="text-xs text-muted-foreground">
          Logo selected • Click "Change Logo" to select a different one
        </p>
      )}
    </div>
  );
}
