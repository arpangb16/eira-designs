'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shirt,
  Palette,
  Type,
  Image as ImageIcon,
  Download,
  Loader2,
  Upload,
  Trash2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  ChevronLeft,
  ShoppingCart,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
  parseTemplate,
  applyCustomizations,
  replaceLogo,
  type TemplateConfig,
  type TextElement,
  type ColorElement,
} from '@/lib/svg-template-parser';

// Template definitions
const templateDefinitions = [
  { id: '101', name: 'Cardinal', svgPath: '/creator/images/101.svg' },
  { id: '102', name: 'Classic', svgPath: '/creator/images/102.svg' },
  { id: '103', name: 'Circle Badge', svgPath: '/creator/images/103.svg' },
  { id: '104', name: 'Martin County', svgPath: '/creator/images/104.svg' },
  { id: '105', name: 'Wewa', svgPath: '/creator/images/105.svg' },
  { id: '107', name: 'Pattern', svgPath: '/creator/images/107.svg' },
  { id: '109', name: 'Falcons', svgPath: '/creator/images/109.svg' },
  { id: '110', name: 'Amberstone', svgPath: '/creator/images/110.svg' },
  { id: '111', name: 'Modern', svgPath: '/creator/images/111.svg' },
];

// T-shirt colors
const shirtColors = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Navy', hex: '#0b223f' },
  { name: 'Royal Blue', hex: '#2d5caa' },
  { name: 'Red', hex: '#ce202f' },
  { name: 'Forest Green', hex: '#304741' },
  { name: 'Purple', hex: '#4e317b' },
  { name: 'Maroon', hex: '#5f2130' },
  { name: 'Gold', hex: '#f7c11c' },
  { name: 'Orange', hex: '#ef6745' },
  { name: 'Grey', hex: '#808285' },
  { name: 'Pink', hex: '#eb80a8' },
];

interface EditorState {
  shirtColor: string;
  textChanges: Record<string, string>;
  colorChanges: Record<string, string>;
  designScale: number;
  designX: number;
  designY: number;
  customLogo: string | null;
}

const defaultEditorState: EditorState = {
  shirtColor: '#FFFFFF',
  textChanges: {},
  colorChanges: {},
  designScale: 100,
  designX: 50,
  designY: 30,
  customLogo: null,
};

export default function CreatorClient() {
  const { toast } = useToast();
  const router = useRouter();
  
  // View state
  const [view, setView] = useState<'gallery' | 'editor'>('gallery');
  
  // Template state
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Editor state
  const [editorState, setEditorState] = useState<EditorState>(defaultEditorState);
  const [exporting, setExporting] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load and parse all templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      const loadedTemplates: TemplateConfig[] = [];
      
      for (const def of templateDefinitions) {
        try {
          const response = await fetch(def.svgPath);
          const content = await response.text();
          const config = parseTemplate(content, def.id, def.name, def.svgPath);
          loadedTemplates.push(config);
        } catch (error) {
          console.error(`Failed to load template ${def.id}:`, error);
        }
      }
      
      setTemplates(loadedTemplates);
      setLoading(false);
    };
    
    loadTemplates();
  }, []);

  // Load SVG content when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      fetch(selectedTemplate.svgPath)
        .then(res => res.text())
        .then(content => setSvgContent(content))
        .catch(err => console.error('Failed to load SVG:', err));
    }
  }, [selectedTemplate]);

  // Select a template and open editor
  const selectTemplate = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    // Initialize text changes with current values
    const textChanges: Record<string, string> = {};
    template.textElements.forEach(el => {
      textChanges[el.content] = el.content;
    });
    // Initialize color changes
    const colorChanges: Record<string, string> = {};
    template.colorElements.forEach(el => {
      colorChanges[el.color] = el.color;
    });
    setEditorState({
      ...defaultEditorState,
      textChanges,
      colorChanges,
    });
    setView('editor');
  };

  // Go back to gallery
  const backToGallery = () => {
    setView('gallery');
    setSelectedTemplate(null);
    setSvgContent('');
    setEditorState(defaultEditorState);
  };

  // Get modified SVG with customizations
  const getModifiedSvg = useCallback(() => {
    if (!svgContent) return '';
    
    let modified = applyCustomizations(
      svgContent,
      editorState.textChanges,
      editorState.colorChanges
    );
    
    // Hide original logo if custom logo is set
    if (editorState.customLogo) {
      modified = replaceLogo(modified, true);
    }
    
    return modified;
  }, [svgContent, editorState]);

  // Handle text change
  const handleTextChange = (originalText: string, newText: string) => {
    setEditorState(prev => ({
      ...prev,
      textChanges: { ...prev.textChanges, [originalText]: newText },
    }));
  };

  // Handle color change
  const handleColorChange = (originalColor: string, newColor: string) => {
    setEditorState(prev => ({
      ...prev,
      colorChanges: { ...prev.colorChanges, [originalColor]: newColor },
    }));
  };

  // Handle shirt color change
  const handleShirtColorChange = (color: string) => {
    setEditorState(prev => ({ ...prev, shirtColor: color }));
  };

  // Handle design position/scale
  const handleDesignPosition = (key: 'designScale' | 'designX' | 'designY', value: number) => {
    setEditorState(prev => ({ ...prev, [key]: value }));
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditorState(prev => ({ ...prev, customLogo: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove custom logo
  const removeLogo = () => {
    setEditorState(prev => ({ ...prev, customLogo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset to defaults
  const resetDesign = () => {
    if (!selectedTemplate) return;
    const textChanges: Record<string, string> = {};
    selectedTemplate.textElements.forEach(el => {
      textChanges[el.content] = el.content;
    });
    const colorChanges: Record<string, string> = {};
    selectedTemplate.colorElements.forEach(el => {
      colorChanges[el.color] = el.color;
    });
    setEditorState({
      ...defaultEditorState,
      textChanges,
      colorChanges,
    });
  };

  // Export PNG
  const exportPNG = async () => {
    if (!selectedTemplate || !svgContent) return;
    
    setExporting(true);
    try {
      const canvas = exportCanvasRef.current;
      if (!canvas) throw new Error('Canvas not found');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');
      
      const size = 1200;
      canvas.width = size;
      canvas.height = size;
      
      // Fill with shirt color
      ctx.fillStyle = editorState.shirtColor;
      ctx.fillRect(0, 0, size, size);
      
      // Load and draw t-shirt
      const shirtImg = new Image();
      shirtImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        shirtImg.onload = () => {
          // Color tint the shirt
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = shirtImg.width;
          tempCanvas.height = shirtImg.height;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(shirtImg, 0, 0);
          
          if (editorState.shirtColor !== '#FFFFFF') {
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            const targetR = parseInt(editorState.shirtColor.slice(1, 3), 16);
            const targetG = parseInt(editorState.shirtColor.slice(3, 5), 16);
            const targetB = parseInt(editorState.shirtColor.slice(5, 7), 16);
            
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] > 0) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const brightness = (r + g + b) / 3;
                const brightnessRatio = brightness / 255;
                const blendFactor = 0.85;
                data[i] = Math.round(targetR * brightnessRatio * blendFactor + r * (1 - blendFactor));
                data[i + 1] = Math.round(targetG * brightnessRatio * blendFactor + g * (1 - blendFactor));
                data[i + 2] = Math.round(targetB * brightnessRatio * blendFactor + b * (1 - blendFactor));
              }
            }
            tempCtx.putImageData(imageData, 0, 0);
          }
          
          // Draw shirt centered
          const scale = Math.min(size / shirtImg.width, size / shirtImg.height) * 0.9;
          const w = shirtImg.width * scale;
          const h = shirtImg.height * scale;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(tempCanvas, x, y, w, h);
          resolve();
        };
        shirtImg.onerror = reject;
        shirtImg.src = '/creator/images/tshirt.png';
      });
      
      // Draw design SVG with multiply blend
      const modifiedSvg = getModifiedSvg();
      const svgBlob = new Blob([modifiedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const svgImg = new Image();
      await new Promise<void>((resolve, reject) => {
        svgImg.onload = () => {
          const designW = (size * editorState.designScale) / 100 * 0.4;
          const designH = (svgImg.height / svgImg.width) * designW;
          const designX = (size * editorState.designX) / 100 - designW / 2;
          const designY = (size * editorState.designY) / 100;
          
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(svgImg, designX, designY, designW, designH);
          ctx.globalCompositeOperation = 'source-over';
          
          URL.revokeObjectURL(svgUrl);
          resolve();
        };
        svgImg.onerror = reject;
        svgImg.src = svgUrl;
      });
      
      // Draw custom logo if present
      if (editorState.customLogo) {
        const logoImg = new Image();
        await new Promise<void>((resolve) => {
          logoImg.onload = () => {
            const logoSize = 80;
            const logoX = (size - logoSize) / 2;
            const logoY = size * 0.15;
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            resolve();
          };
          logoImg.onerror = () => resolve();
          logoImg.src = editorState.customLogo!;
        });
      }
      
      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${selectedTemplate.name}_design.png`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: 'Success', description: 'Design exported!' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Error', description: 'Failed to export', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // Render Gallery View
  const renderGallery = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Design Templates</h1>
        <p className="text-gray-600 mt-2">Choose a template to customize for your team</p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                onClick={() => selectTemplate(template)}
              >
                <div className="aspect-square bg-gray-100 relative">
                  <div
                    className="absolute inset-4"
                    dangerouslySetInnerHTML={{ __html: '' }}
                  >
                    <img
                      src={template.svgPath}
                      alt={template.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="p-3 border-t">
                  <h3 className="font-semibold text-center">{template.name}</h3>
                  <div className="flex justify-center gap-1 mt-2">
                    {template.textElements.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Type className="h-3 w-3 mr-1" />
                        {template.textElements.length} Text
                      </Badge>
                    )}
                    {template.hasLogo && (
                      <Badge variant="secondary" className="text-xs">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Logo
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Editor View
  const renderEditor = () => {
    if (!selectedTemplate) return null;
    
    const modifiedSvg = getModifiedSvg();
    
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={backToGallery}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <h2 className="font-semibold">{selectedTemplate.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetDesign}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={exportPNG}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Export PNG
            </Button>
          </div>
        </div>
        
        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Panel */}
          <div className="flex-1 bg-gray-100 p-6 flex items-center justify-center">
            <div
              ref={previewRef}
              className="relative bg-white rounded-lg shadow-lg overflow-hidden"
              style={{
                width: '500px',
                height: '500px',
                backgroundColor: editorState.shirtColor,
              }}
            >
              {/* T-Shirt Base */}
              <img
                src="/creator/images/tshirt.png"
                alt="T-Shirt"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  filter: editorState.shirtColor !== '#FFFFFF'
                    ? `opacity(0.9)`
                    : 'none',
                  mixBlendMode: editorState.shirtColor !== '#FFFFFF' ? 'multiply' : 'normal',
                }}
              />
              
              {/* Design Overlay */}
              {modifiedSvg && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${editorState.designX}%`,
                    top: `${editorState.designY}%`,
                    transform: `translateX(-50%) scale(${editorState.designScale / 100})`,
                    width: '40%',
                    mixBlendMode: 'multiply',
                  }}
                  dangerouslySetInnerHTML={{ __html: modifiedSvg }}
                />
              )}
              
              {/* Custom Logo Overlay */}
              {editorState.customLogo && (
                <div
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '15%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '60px',
                  }}
                >
                  <img
                    src={editorState.customLogo}
                    alt="Custom Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Controls Panel */}
          <div className="w-80 bg-white border-l overflow-y-auto">
            <Tabs defaultValue="product" className="w-full">
              <TabsList className="w-full grid grid-cols-4 p-1">
                <TabsTrigger value="product" className="text-xs">
                  <Shirt className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="text" className="text-xs">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="colors" className="text-xs">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="logo" className="text-xs">
                  <ImageIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              
              {/* Product Tab */}
              <TabsContent value="product" className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Shirt Color</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {shirtColors.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => handleShirtColorChange(color.hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          editorState.shirtColor === color.hex
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Design Size</Label>
                  <Slider
                    value={[editorState.designScale]}
                    onValueChange={([v]) => handleDesignPosition('designScale', v)}
                    min={50}
                    max={150}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small</span>
                    <span>{editorState.designScale}%</span>
                    <span>Large</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Vertical Position</Label>
                  <Slider
                    value={[editorState.designY]}
                    onValueChange={([v]) => handleDesignPosition('designY', v)}
                    min={15}
                    max={60}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Top</span>
                    <span>Bottom</span>
                  </div>
                </div>
              </TabsContent>
              
              {/* Text Tab */}
              <TabsContent value="text" className="p-4 space-y-4">
                {selectedTemplate.textElements.length > 0 ? (
                  selectedTemplate.textElements.map((textEl, idx) => (
                    <div key={idx}>
                      <Label className="text-sm font-medium">Text {idx + 1}</Label>
                      <Input
                        value={editorState.textChanges[textEl.content] || textEl.content}
                        onChange={(e) => handleTextChange(textEl.content, e.target.value)}
                        className="mt-1"
                        placeholder={textEl.content}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No editable text in this template</p>
                )}
              </TabsContent>
              
              {/* Colors Tab */}
              <TabsContent value="colors" className="p-4 space-y-4">
                {selectedTemplate.colorElements.length > 0 ? (
                  selectedTemplate.colorElements.slice(0, 8).map((colorEl, idx) => (
                    <div key={idx}>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: colorEl.color }}
                        />
                        Color {idx + 1}
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={editorState.colorChanges[colorEl.color] || colorEl.color}
                          onChange={(e) => handleColorChange(colorEl.color, e.target.value)}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={editorState.colorChanges[colorEl.color] || colorEl.color}
                          onChange={(e) => handleColorChange(colorEl.color, e.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No customizable colors detected</p>
                )}
              </TabsContent>
              
              {/* Logo Tab */}
              <TabsContent value="logo" className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Upload Your Logo</Label>
                  <p className="text-xs text-gray-500 mt-1">PNG or SVG recommended</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  
                  {editorState.customLogo ? (
                    <div className="mt-3">
                      <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={editorState.customLogo}
                          alt="Custom Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  )}
                </div>
                
                {selectedTemplate.hasLogo && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500">
                      This template includes a default logo. Upload your own to replace it.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50">
      <AnimatePresence mode="wait">
        {view === 'gallery' ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderGallery()}
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            {renderEditor()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden canvas for export */}
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}
