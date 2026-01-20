'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Save,
  Upload,
  Trash2,
  Palette,
  Type,
  Shirt,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// T-shirt designs data
const tshirtDesigns = [
  { id: 1, title: '101', image: '/creator/images/tshirt.png', template: '/creator/images/101.svg' },
  { id: 2, title: '102', image: '/creator/images/tshirt.png' },
  { id: 3, title: '103', image: '/creator/images/tshirt.png' },
  { id: 4, title: '104', image: '/creator/images/tshirt.png' },
  { id: 5, title: '105', image: '/creator/images/tshirt.png' },
  { id: 6, title: '106', image: '/creator/images/tshirt.png' },
];

// Material/Pantone colors data
const pantoneColors = [
  { code: 'MAT-001', name: 'White', hex: '#FFFFFF' },
  { code: 'MAT-002', name: 'Black', hex: '#000000' },
  { code: 'MAT-003', name: 'Dark Heather', hex: null, image: '/creator/images/dark-heather.png' },
  { code: 'MAT-004', name: 'Graphite Heather', hex: null, image: '/creator/images/graphite-heather.png' },
  { code: 'MAT-005', name: 'Sports Grey', hex: null, image: '/creator/images/sports-grey.png' },
  { code: 'MAT-006', name: 'Navy', hex: '#0b223f' },
  { code: 'MAT-007', name: 'Royal Blue', hex: '#2d5caa' },
  { code: 'MAT-008', name: 'Carolina Blue', hex: '#90b2de' },
  { code: 'MAT-009', name: 'Forest Green', hex: '#304741' },
  { code: 'MAT-010', name: 'Irish Green', hex: '#149c5e' },
  { code: 'MAT-011', name: 'Purple', hex: '#4e317b' },
  { code: 'MAT-012', name: 'Maroon', hex: '#5f2130' },
  { code: 'MAT-013', name: 'Cardinal Red', hex: '#961f3b' },
  { code: 'MAT-014', name: 'Red', hex: '#ce202f' },
  { code: 'MAT-015', name: 'Orange', hex: '#ef6745' },
  { code: 'MAT-016', name: 'Gold', hex: '#f7c11c' },
];

interface DesignState {
  shirtColor: string;
  svgColors: {
    accentColor: string;
    text1FillColor: string;
    text1OutlineColor: string;
    text2Color: string;
  };
  textContent: {
    text1: string;
    text2: string;
  };
  textSize: {
    text1: number;
    text2: number;
  };
  logo: string | null;
}

const defaultDesignState: DesignState = {
  shirtColor: '#FFFFFF',
  svgColors: {
    accentColor: '#ffcd00',
    text1FillColor: '#9ed9dd',
    text1OutlineColor: '#76bc21',
    text2Color: '#cfc393',
  },
  textContent: {
    text1: 'HARLEM',
    text2: 'WRESTLING',
  },
  textSize: {
    text1: 100,
    text2: 100,
  },
  logo: null,
};

export default function CreatorClient() {
  const { toast } = useToast();
  const [selectedDesign, setSelectedDesign] = useState<typeof tshirtDesigns[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [designStates, setDesignStates] = useState<Record<number, DesignState>>({});
  const [currentState, setCurrentState] = useState<DesignState>(defaultDesignState);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved states from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('creatorDesignStates');
    if (saved) {
      try {
        setDesignStates(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved designs:', e);
      }
    }
  }, []);

  // Save states to localStorage
  const saveToLocalStorage = useCallback((states: Record<number, DesignState>) => {
    localStorage.setItem('creatorDesignStates', JSON.stringify(states));
  }, []);

  // Load SVG template when design changes
  useEffect(() => {
    if (selectedDesign?.template) {
      fetch(selectedDesign.template)
        .then((res) => res.text())
        .then((svg) => setSvgContent(svg))
        .catch((err) => console.error('Error loading SVG:', err));
    } else {
      setSvgContent(null);
    }
  }, [selectedDesign]);

  // Apply color to canvas
  const applyColorToCanvas = useCallback(
    (imageSrc: string, targetColor: string, canvas: HTMLCanvasElement) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve();
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const targetR = parseInt(targetColor.slice(1, 3), 16);
            const targetG = parseInt(targetColor.slice(3, 5), 16);
            const targetB = parseInt(targetColor.slice(5, 7), 16);

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              if (a > 10) {
                const brightness = (r + g + b) / 3;
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max === 0 ? 0 : (max - min) / max;

                if (brightness > 70 && saturation < 0.3) {
                  const brightnessRatio = brightness / 255;
                  let blendFactor = 0.88;

                  if (brightness > 200) blendFactor = 0.92;
                  else if (brightness < 100) blendFactor = 0.75;

                  const newR = Math.round(targetR * brightnessRatio * blendFactor + r * (1 - blendFactor));
                  const newG = Math.round(targetG * brightnessRatio * blendFactor + g * (1 - blendFactor));
                  const newB = Math.round(targetB * brightnessRatio * blendFactor + b * (1 - blendFactor));

                  data[i] = Math.min(255, Math.max(0, newR));
                  data[i + 1] = Math.min(255, Math.max(0, newG));
                  data[i + 2] = Math.min(255, Math.max(0, newB));
                }
              }
            }

            ctx.putImageData(imageData, 0, 0);
          } catch (e) {
            console.error('Canvas error:', e);
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imageSrc;
      });
    },
    []
  );

  // Apply SVG color changes
  const getModifiedSvg = useCallback(
    (originalSvg: string, state: DesignState) => {
      let svg = originalSvg;

      // Replace colors in SVG
      // These are example replacements - adjust based on actual SVG structure
      svg = svg.replace(/#ffcd00/gi, state.svgColors.accentColor);
      svg = svg.replace(/#9ed9dd/gi, state.svgColors.text1FillColor);
      svg = svg.replace(/#76bc21/gi, state.svgColors.text1OutlineColor);
      svg = svg.replace(/#cfc393/gi, state.svgColors.text2Color);

      // Replace text content
      svg = svg.replace(/HARLEM/g, state.textContent.text1);
      svg = svg.replace(/WRESTLING/g, state.textContent.text2);

      return svg;
    },
    []
  );

  // Open design modal
  const openDesign = (design: typeof tshirtDesigns[0]) => {
    setSelectedDesign(design);
    const savedState = designStates[design.id] || { ...defaultDesignState };
    setCurrentState(savedState);
    setModalOpen(true);
  };

  // Handle shirt color change
  const handleShirtColorChange = (color: typeof pantoneColors[0]) => {
    const newColor = color.hex || '#FFFFFF';
    setCurrentState((prev) => ({ ...prev, shirtColor: newColor }));
  };

  // Handle SVG color change
  const handleSvgColorChange = (key: keyof DesignState['svgColors'], value: string) => {
    setCurrentState((prev) => ({
      ...prev,
      svgColors: { ...prev.svgColors, [key]: value },
    }));
  };

  // Handle text change
  const handleTextChange = (key: 'text1' | 'text2', value: string) => {
    setCurrentState((prev) => ({
      ...prev,
      textContent: { ...prev.textContent, [key]: value },
    }));
  };

  // Handle text size change
  const handleTextSizeChange = (key: 'text1' | 'text2', value: number) => {
    setCurrentState((prev) => ({
      ...prev,
      textSize: { ...prev.textSize, [key]: value },
    }));
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCurrentState((prev) => ({ ...prev, logo: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const removeLogo = () => {
    setCurrentState((prev) => ({ ...prev, logo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save design
  const saveDesign = () => {
    if (!selectedDesign) return;

    const newStates = {
      ...designStates,
      [selectedDesign.id]: currentState,
    };
    setDesignStates(newStates);
    saveToLocalStorage(newStates);

    toast({
      title: 'Design Saved',
      description: `Design ${selectedDesign.title} has been saved successfully.`,
    });
  };

  // Render gallery item preview
  const renderGalleryPreview = (design: typeof tshirtDesigns[0]) => {
    const state = designStates[design.id] || defaultDesignState;
    return (
      <div
        className="relative w-full h-64 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: state.shirtColor === '#FFFFFF' ? '#f8f9fa' : state.shirtColor }}
      >
        <canvas
          ref={(el) => {
            if (el && design.image) {
              applyColorToCanvas(design.image, state.shirtColor, el);
            }
          }}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">T-Shirt Design Creator</h1>
        <p className="text-gray-600">Click on any design to customize colors, text, and logos</p>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tshirtDesigns.map((design) => (
          <motion.div
            key={design.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              className="cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
              onClick={() => openDesign(design)}
            >
              {renderGalleryPreview(design)}
              <div className="p-4 text-center">
                <h3 className="font-semibold text-lg">Design {design.title}</h3>
                {design.template && (
                  <Badge variant="secondary" className="mt-2">
                    Has Template
                  </Badge>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Customization Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5" />
              Customize Design {selectedDesign?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Preview Section */}
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Preview
              </h3>
              <div
                className="relative w-full aspect-square flex items-center justify-center rounded-lg overflow-hidden"
                style={{ backgroundColor: currentState.shirtColor === '#FFFFFF' ? '#f0f0f0' : currentState.shirtColor }}
              >
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full max-h-full object-contain"
                />
                {svgContent && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ padding: '15%' }}
                    dangerouslySetInnerHTML={{ __html: getModifiedSvg(svgContent, currentState) }}
                  />
                )}
                {currentState.logo && (
                  <div
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16"
                  >
                    <img
                      src={currentState.logo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Controls Section */}
            <ScrollArea className="h-[500px] pr-4">
              <Tabs defaultValue="shirt" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="shirt" className="flex items-center gap-1">
                    <Palette className="h-4 w-4" />
                    Shirt
                  </TabsTrigger>
                  <TabsTrigger value="design" className="flex items-center gap-1">
                    <Type className="h-4 w-4" />
                    Design
                  </TabsTrigger>
                  <TabsTrigger value="logo" className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    Logo
                  </TabsTrigger>
                </TabsList>

                {/* Shirt Color Tab */}
                <TabsContent value="shirt" className="space-y-4 mt-4">
                  <h4 className="font-medium">T-Shirt Color</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {pantoneColors.map((color) => (
                      <button
                        key={color.code}
                        onClick={() => handleShirtColorChange(color)}
                        className={`relative w-full aspect-square rounded-lg border-2 transition-all ${
                          currentState.shirtColor === (color.hex || '#FFFFFF')
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={
                          color.hex
                            ? { backgroundColor: color.hex }
                            : { backgroundImage: `url(${color.image})`, backgroundSize: 'cover' }
                        }
                        title={color.name}
                      >
                        {currentState.shirtColor === (color.hex || '#FFFFFF') && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Selected: {pantoneColors.find((c) => c.hex === currentState.shirtColor)?.name || 'Custom'}
                  </p>
                </TabsContent>

                {/* Design Colors Tab */}
                <TabsContent value="design" className="space-y-6 mt-4">
                  {selectedDesign?.template ? (
                    <>
                      {/* Text Inputs */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Text Content</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="text1">Text 1</Label>
                            <Input
                              id="text1"
                              value={currentState.textContent.text1}
                              onChange={(e) => handleTextChange('text1', e.target.value)}
                              placeholder="HARLEM"
                            />
                            <div className="mt-2">
                              <Label className="text-xs text-gray-500">Size: {currentState.textSize.text1}%</Label>
                              <Slider
                                value={[currentState.textSize.text1]}
                                onValueChange={([v]) => handleTextSizeChange('text1', v)}
                                min={50}
                                max={150}
                                step={5}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="text2">Text 2</Label>
                            <Input
                              id="text2"
                              value={currentState.textContent.text2}
                              onChange={(e) => handleTextChange('text2', e.target.value)}
                              placeholder="WRESTLING"
                            />
                            <div className="mt-2">
                              <Label className="text-xs text-gray-500">Size: {currentState.textSize.text2}%</Label>
                              <Slider
                                value={[currentState.textSize.text2]}
                                onValueChange={([v]) => handleTextSizeChange('text2', v)}
                                min={50}
                                max={150}
                                step={5}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Color Pickers */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Design Colors</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Accent Color</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={currentState.svgColors.accentColor}
                                onChange={(e) => handleSvgColorChange('accentColor', e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <span className="text-sm text-gray-600">
                                {currentState.svgColors.accentColor}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label>Text 1 Fill</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={currentState.svgColors.text1FillColor}
                                onChange={(e) => handleSvgColorChange('text1FillColor', e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <span className="text-sm text-gray-600">
                                {currentState.svgColors.text1FillColor}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label>Text 1 Outline</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={currentState.svgColors.text1OutlineColor}
                                onChange={(e) => handleSvgColorChange('text1OutlineColor', e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <span className="text-sm text-gray-600">
                                {currentState.svgColors.text1OutlineColor}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label>Text 2 Color</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="color"
                                value={currentState.svgColors.text2Color}
                                onChange={(e) => handleSvgColorChange('text2Color', e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <span className="text-sm text-gray-600">
                                {currentState.svgColors.text2Color}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>This design doesn&apos;t have a customizable template.</p>
                      <p className="text-sm mt-1">Only shirt color can be changed.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Logo Tab */}
                <TabsContent value="logo" className="space-y-4 mt-4">
                  <h4 className="font-medium">Upload Logo</h4>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Upload className="h-5 w-5" />
                        <span>Click to upload logo</span>
                      </Label>
                    </div>

                    {currentState.logo && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={currentState.logo}
                          alt="Uploaded logo"
                          className="w-16 h-16 object-contain border rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Logo uploaded</p>
                          <p className="text-sm text-gray-500">Appears at the bottom of the design</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeLogo}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="mt-6 pt-4 border-t">
                <Button onClick={saveDesign} className="w-full" size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  Save Design
                </Button>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
