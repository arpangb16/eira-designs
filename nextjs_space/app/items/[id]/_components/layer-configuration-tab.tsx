'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Layers, Type, Palette, AlertCircle, Grid3x3, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/color-picker';

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
  layerType: 'text' | 'graphic';
  value: string; // text content or hex color
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
          initialConfigs[layer.id] = {
            layerId: layer.id,
            layerName: layer.name,
            layerType: isTextLayer ? 'text' : 'graphic',
            value: isTextLayer ? (layer.content || '') : (layer.fill || '#000000')
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

  // Flatten nested layers
  function flattenLayers(layers: SVGLayer[]): SVGLayer[] {
    const result: SVGLayer[] = [];
    
    function traverse(layer: SVGLayer) {
      // Add current layer if it's a leaf node or has content
      if (!layer.children || layer.children.length === 0 || layer.content || layer.fill) {
        result.push(layer);
      }
      
      // Traverse children
      if (layer.children && layer.children.length > 0) {
        layer.children.forEach(child => traverse(child));
      }
    }
    
    layers.forEach(layer => traverse(layer));
    return result;
  }

  // Update layer configuration
  function updateLayerConfig(layerId: string, value: string) {
    setLayerConfigs(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        value
      }
    }));
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

      const config = {
        layers: layerModifications,
        patterns: [],
        embellishments: [],
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
                  <ColorPicker
                    label={`${config.layerName} (${layer.id})`}
                    color={config.value}
                    onChange={(color) => updateLayerConfig(layer.id, color)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Patterns Section (Coming Soon) */}
      {patterns.length > 0 && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              Patterns (Coming Soon)
            </CardTitle>
            <CardDescription>Add pattern layers to your design</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pattern layer functionality will be available soon. You'll be able to add patterns as additional layers.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Embellishments Section (Coming Soon) */}
      {embellishments.length > 0 && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Embellishments (Coming Soon)
            </CardTitle>
            <CardDescription>Add embellishment layers to your design</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Embellishment layer functionality will be available soon. You'll be able to add embellishments as additional layers.
            </p>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
