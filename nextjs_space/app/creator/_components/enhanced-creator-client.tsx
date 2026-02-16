'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/file-upload';
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
  ChevronLeft,
  Save,
  Edit,
  X,
  FlipHorizontal,
  Move,
  Maximize2,
  Layers,
  Plus,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { parseTemplate, type TemplateConfig } from '@/lib/svg-template-parser';
import { TemplateSelector } from './template-selector';

// Interface for design template (logo with text)
interface DesignTemplate {
  id: string;
  name: string;
  logoUrl: string;
  text: string;
  x: number; // Position X (percentage)
  y: number; // Position Y (percentage)
  width: number; // Width (percentage)
  height: number; // Height (percentage)
  flipped: boolean; // Horizontal flip
}

// Interface for saved design
interface SavedDesign {
  id: string;
  name: string;
  designData: any; // Parsed design data object
  previewImage?: string | null;
  apparelType?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for SVG layer/object
interface SVGObject {
  id: string;
  type: 'group' | 'path' | 'rect' | 'circle' | 'text' | 'image' | 'g';
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  isApparel?: boolean; // Detected as t-shirt, etc.
}

export default function EnhancedCreatorClient() {
  const { toast } = useToast();
  const router = useRouter();
  
  // View state
  const [view, setView] = useState<'gallery' | 'editor'>('gallery');
  
  // File uploads
  const [pngMaskPath, setPngMaskPath] = useState<string>('');
  const [pngMaskUrl, setPngMaskUrl] = useState<string>('');
  const [svgBoundaryPath, setSvgBoundaryPath] = useState<string>('');
  const [svgBoundaryContent, setSvgBoundaryContent] = useState<string>('');
  const [svgBoundaryBounds, setSvgBoundaryBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // SVG objects/layers
  const [svgObjects, setSvgObjects] = useState<SVGObject[]>([]);
  const [detectedApparel, setDetectedApparel] = useState<SVGObject | null>(null);
  
  // Templates (logos with text)
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Design state
  const [shirtColor, setShirtColor] = useState('#FFFFFF');
  const [designName, setDesignName] = useState('');
  
  // Saved designs
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [editingDesign, setEditingDesign] = useState<SavedDesign | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Template selector
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  
  // Refs
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  
  // Load saved designs
  useEffect(() => {
    loadSavedDesigns();
  }, []);
  
  // Parse SVG boundaries and detect objects
  useEffect(() => {
    if (svgBoundaryContent) {
      parseSVGBoundaries(svgBoundaryContent);
    }
  }, [svgBoundaryContent]);
  
  // Load PNG mask URL
  useEffect(() => {
    if (pngMaskPath) {
      fetchFileUrl(pngMaskPath, true).then(setPngMaskUrl);
    }
  }, [pngMaskPath]);
  
  // Load saved designs
  async function loadSavedDesigns() {
    try {
      setLoading(true);
      const response = await fetch('/api/creator-designs');
      if (response.ok) {
        const designs = await response.json();
        // Parse designData for each design
        const parsedDesigns = designs.map((d: any) => ({
          ...d,
          designData: typeof d.designData === 'string' ? JSON.parse(d.designData) : d.designData,
        }));
        setSavedDesigns(parsedDesigns);
      }
    } catch (error) {
      console.error('Error loading designs:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // Fetch file URL from S3
  async function fetchFileUrl(path: string, isPublic: boolean): Promise<string> {
    try {
      const response = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path: path, isPublic }),
      });
      const data = await response.json();
      return data.url || '';
    } catch (error) {
      console.error('Error fetching file URL:', error);
      return '';
    }
  }
  
  // Parse SVG to detect layers and objects
  function parseSVGBoundaries(svgContent: string) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      if (!svgElement) return;
      
      const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 100, 100];
      const bounds = { x: viewBox[0], y: viewBox[1], width: viewBox[2], height: viewBox[3] };
      setSvgBoundaryBounds(bounds);
      
      const objects: SVGObject[] = [];
      
      // Find all groups and elements
      const allElements = svgElement.querySelectorAll('g, path, rect, circle, text, image');
      allElements.forEach((el, index) => {
        const id = el.id || el.getAttribute('data-name') || `element-${index}`;
        const type = el.tagName.toLowerCase() as SVGObject['type'];
        const name = el.getAttribute('data-name') || el.id || type;
        
        // Try to get bounds
        let elementBounds = { x: 0, y: 0, width: 0, height: 0 };
        if (el instanceof SVGGraphicsElement) {
          try {
            const bbox = el.getBBox();
            elementBounds = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
          } catch (e) {
            // Fallback to viewBox
            elementBounds = bounds;
          }
        }
        
        // Detect if it's apparel-related (t-shirt, etc.)
        const isApparel = 
          name.toLowerCase().includes('shirt') ||
          name.toLowerCase().includes('tshirt') ||
          name.toLowerCase().includes('apparel') ||
          name.toLowerCase().includes('garment');
        
        objects.push({
          id,
          type,
          name,
          bounds: elementBounds,
          isApparel,
        });
        
        if (isApparel && !detectedApparel) {
          setDetectedApparel({ id, type, name, bounds: elementBounds, isApparel: true });
        }
      });
      
      setSvgObjects(objects);
      toast({ title: 'Success', description: `Detected ${objects.length} objects in SVG` });
    } catch (error) {
      console.error('Error parsing SVG:', error);
      toast({ title: 'Error', description: 'Failed to parse SVG', variant: 'destructive' });
    }
  }
  
  // Add new template - opens template selector
  function addTemplate() {
    setTemplateSelectorOpen(true);
  }
  
  // Handle template selection from library
  async function handleTemplateSelect(template: any) {
    try {
      // Get SVG URL if available
      let logoUrl = '';
      if (template.svgPath) {
        logoUrl = await fetchFileUrl(template.svgPath, template.svgIsPublic ?? false);
      }
      
      // Extract text from layer data if available
      let defaultText = 'Your Text';
      if (template.layerData) {
        try {
          const layerData = JSON.parse(template.layerData);
          const textLayers = layerData.layers?.filter((l: any) => l.type === 'text');
          if (textLayers && textLayers.length > 0) {
            defaultText = textLayers[0].text || 'Your Text';
          }
        } catch (e) {
          console.error('Failed to parse layer data:', e);
        }
      }
      
      const newTemplate: DesignTemplate = {
        id: `template-${Date.now()}`,
        name: template.name,
        logoUrl: logoUrl,
        text: defaultText,
        x: 50,
        y: 30,
        width: 20,
        height: 20,
        flipped: false,
      };
      
      setTemplates([...templates, newTemplate]);
      setSelectedTemplate(newTemplate.id);
      
      toast({
        title: 'Template Added',
        description: `${template.name} has been added to your design`,
      });
    } catch (error) {
      console.error('Failed to add template:', error);
      toast({
        title: 'Error',
        description: 'Failed to add template. Please try again.',
        variant: 'destructive',
      });
    }
  }
  
  // Update template
  function updateTemplate(id: string, updates: Partial<DesignTemplate>) {
    setTemplates(templates.map(t => t.id === id ? { ...t, ...updates } : t));
  }
  
  // Delete template
  function deleteTemplate(id: string) {
    setTemplates(templates.filter(t => t.id !== id));
    if (selectedTemplate === id) {
      setSelectedTemplate(null);
    }
  }
  
  // Constrain template within boundaries
  function constrainTemplate(template: DesignTemplate): DesignTemplate {
    if (!svgBoundaryBounds) return template;
    
    const bounds = svgBoundaryBounds;
    const constrained = { ...template };
    
    // Constrain X position
    constrained.x = Math.max(bounds.x, Math.min(bounds.x + bounds.width - template.width, template.x));
    
    // Constrain Y position
    constrained.y = Math.max(bounds.y, Math.min(bounds.y + bounds.height - template.height, template.y));
    
    // Constrain width
    const maxWidth = bounds.x + bounds.width - constrained.x;
    constrained.width = Math.min(template.width, maxWidth);
    
    // Constrain height
    const maxHeight = bounds.y + bounds.height - constrained.y;
    constrained.height = Math.min(template.height, maxHeight);
    
    return constrained;
  }
  
  // Handle template drag
  function handleTemplateDrag(e: React.MouseEvent, templateId: string) {
    if (!previewRef.current || !svgBoundaryBounds) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const updated = constrainTemplate({ ...template, x, y });
    updateTemplate(templateId, { x: updated.x, y: updated.y });
  }
  
  // Handle template resize
  function handleTemplateResize(e: React.MouseEvent, templateId: string, corner: 'nw' | 'ne' | 'sw' | 'se') {
    if (!previewRef.current || !svgBoundaryBounds) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    let newWidth = template.width;
    let newHeight = template.height;
    let newX = template.x;
    let newY = template.y;
    
    switch (corner) {
      case 'se':
        newWidth = Math.max(5, x - template.x);
        newHeight = Math.max(5, y - template.y);
        break;
      case 'sw':
        newWidth = Math.max(5, template.x + template.width - x);
        newX = x;
        newHeight = Math.max(5, y - template.y);
        break;
      case 'ne':
        newWidth = Math.max(5, x - template.x);
        newHeight = Math.max(5, template.y + template.height - y);
        newY = y;
        break;
      case 'nw':
        newWidth = Math.max(5, template.x + template.width - x);
        newX = x;
        newHeight = Math.max(5, template.y + template.height - y);
        newY = y;
        break;
    }
    
    const updated = constrainTemplate({ ...template, x: newX, y: newY, width: newWidth, height: newHeight });
    updateTemplate(templateId, updated);
  }
  
  // Flip template horizontally
  function flipTemplate(id: string) {
    updateTemplate(id, { flipped: !templates.find(t => t.id === id)?.flipped });
  }
  
  // Save design
  async function saveDesign() {
    if (!designName.trim()) {
      toast({ title: 'Error', description: 'Please enter a design name', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      const designData = {
        pngMaskPath: pngMaskPath || null,
        svgBoundaryPath: svgBoundaryPath || null,
        templates,
        shirtColor,
        svgObjects,
        detectedApparel,
      };
      
      const url = editingDesign ? `/api/creator-designs/${editingDesign.id}` : '/api/creator-designs';
      const method = editingDesign ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designName,
          designData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save error response:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to save design');
      }
      
      const savedDesign = await response.json();
      console.log('Design saved successfully:', savedDesign);
      
      toast({ title: 'Success', description: 'Design saved!' });
      setEditingDesign(null);
      setDesignName('');
      loadSavedDesigns();
    } catch (error) {
      console.error('Error saving design:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save design';
      toast({ 
        title: 'Error', 
        description: errorMessage,
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  }
  
  // Load design for editing
  function loadDesign(design: SavedDesign) {
    // designData should already be parsed from loadSavedDesigns
    const designData = design.designData || {};
    
    setDesignName(design.name);
    setPngMaskPath(designData.pngMaskPath || '');
    setSvgBoundaryPath(designData.svgBoundaryPath || '');
    setTemplates(designData.templates || []);
    setShirtColor(designData.shirtColor || '#FFFFFF');
    setEditingDesign(design);
    setView('editor');
    
    // Load SVG content if boundary path exists
    if (designData.svgBoundaryPath) {
      fetchFileUrl(designData.svgBoundaryPath, true).then(url => {
        if (url) {
          fetch(url).then(res => res.text()).then(setSvgBoundaryContent);
        }
      });
    }
    
    // Load PNG mask URL if path exists
    if (designData.pngMaskPath) {
      fetchFileUrl(designData.pngMaskPath, true).then(setPngMaskUrl);
    }
  }
  
  // Delete design
  async function deleteDesign(id: string) {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    try {
      const response = await fetch(`/api/creator-designs/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete design');
      toast({ title: 'Success', description: 'Design deleted!' });
      loadSavedDesigns();
    } catch (error) {
      console.error('Error deleting design:', error);
      toast({ title: 'Error', description: 'Failed to delete design', variant: 'destructive' });
    }
  }
  
  // Render Gallery View
  const renderGallery = () => (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
          <p className="text-gray-600 mt-2">Create and manage your custom designs</p>
        </div>
        <Button onClick={() => setView('editor')}>
          <Plus className="h-4 w-4 mr-2" />
          New Design
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : savedDesigns.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No designs yet. Create your first design!</p>
          <Button onClick={() => setView('editor')}>Create Design</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedDesigns.map((design) => (
            <Card key={design.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 relative">
                {/* Preview would go here */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shirt className="h-16 w-16 text-gray-400" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">{design.name}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadDesign(design)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteDesign(design.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render Editor View
  const renderEditor = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setView('gallery'); setEditingDesign(null); }}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Input
            placeholder="Design Name"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveDesign} disabled={saving || !designName.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'Saving...' : 'Save Design'}
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
            style={{ width: '600px', height: '600px' }}
          >
            {/* PNG Mask Layer */}
            {pngMaskUrl && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: shirtColor,
                  WebkitMaskImage: `url(${pngMaskUrl})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskPosition: 'center',
                  WebkitMaskRepeat: 'no-repeat',
                  maskImage: `url(${pngMaskUrl})`,
                  maskSize: 'contain',
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat',
                }}
              />
            )}
            
            {/* SVG Boundary */}
            {svgBoundaryContent && (
              <div
                className="absolute inset-0 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: svgBoundaryContent }}
                style={{ opacity: 0.3 }}
              />
            )}
            
            {/* Templates */}
            {templates.map((template) => (
              <div
                key={template.id}
                className={`absolute border-2 ${selectedTemplate === template.id ? 'border-blue-500' : 'border-transparent'}`}
                style={{
                  left: `${template.x}%`,
                  top: `${template.y}%`,
                  width: `${template.width}%`,
                  height: `${template.height}%`,
                  cursor: selectedTemplate === template.id ? 'move' : 'pointer',
                }}
                onClick={() => setSelectedTemplate(template.id)}
                onMouseDown={(e) => {
                  if (selectedTemplate === template.id) {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX, y: e.clientY });
                  }
                }}
              >
                {/* Logo */}
                {template.logoUrl && (
                  <img
                    src={template.logoUrl}
                    alt={template.name}
                    className="w-full h-full object-contain"
                    style={{ transform: template.flipped ? 'scaleX(-1)' : 'none' }}
                  />
                )}
                
                {/* Text */}
                {template.text && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center p-1 text-xs">
                    {template.text}
                  </div>
                )}
                
                {/* Resize handles */}
                {selectedTemplate === template.id && (
                  <>
                    <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                      }}
                    />
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                      }}
                    />
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                      }}
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Controls Panel */}
        <div className="w-96 bg-white border-l overflow-y-auto">
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="w-full grid grid-cols-4 p-1">
              <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
              <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
              <TabsTrigger value="product" className="text-xs">Product</TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
            </TabsList>
            
            {/* Files Tab */}
            <TabsContent value="files" className="p-4 space-y-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-1">📝 SVG Files Only</p>
                <p className="text-xs text-blue-700">
                  This creator works with SVG files. SVG files work directly in the browser without conversion.
                </p>
              </div>
              
              <div>
                <Label>SVG Boundaries (Required)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  SVG file that defines design boundaries. Templates will be constrained within these boundaries.
                </p>
                <FileUpload
                  accept=".svg,image/svg+xml"
                  isPublic={true}
                  onUploadComplete={async (path) => {
                    setSvgBoundaryPath(path);
                    const url = await fetchFileUrl(path, true);
                    fetch(url).then(res => res.text()).then(setSvgBoundaryContent);
                  }}
                  existingFilePath={svgBoundaryPath}
                />
              </div>
              
              <div>
                <Label>PNG Mask (Optional - for color changes)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  PNG file that defines the shape for color application. If not provided, SVG boundaries will be used.
                </p>
                <FileUpload
                  accept=".png,image/png"
                  isPublic={true}
                  onUploadComplete={(path) => setPngMaskPath(path)}
                  existingFilePath={pngMaskPath}
                />
              </div>
              
              {svgObjects.length > 0 && (
                <div className="border-t pt-4">
                  <Label>Detected Objects ({svgObjects.length})</Label>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {svgObjects.map((obj) => (
                      <div key={obj.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                        <Layers className="h-4 w-4" />
                        <span className="flex-1">{obj.name}</span>
                        {obj.isApparel && <Badge variant="secondary">Apparel</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Templates Tab */}
            <TabsContent value="templates" className="p-4 space-y-4">
              <Button onClick={addTemplate} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
              
              {templates.map((template) => (
                <Card key={template.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Input
                      value={template.name}
                      onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
                      className="flex-1 mr-2"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Logo (SVG only)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        SVG files work best and don't require conversion
                      </p>
                      <FileUpload
                        accept=".svg,image/svg+xml"
                        isPublic={true}
                        onUploadComplete={async (path) => {
                          const url = await fetchFileUrl(path, true);
                          updateTemplate(template.id, { logoUrl: url });
                        }}
                        existingFilePath={template.logoUrl}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Text</Label>
                      <Input
                        value={template.text}
                        onChange={(e) => updateTemplate(template.id, { text: e.target.value })}
                        placeholder="Enter text"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => flipTemplate(template.id)}
                        className="flex-1"
                      >
                        <FlipHorizontal className="h-4 w-4 mr-1" />
                        Flip
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(template.id)}
                        className="flex-1"
                      >
                        <Move className="h-4 w-4 mr-1" />
                        Select
                      </Button>
                    </div>
                    
                    {selectedTemplate === template.id && (
                      <div className="space-y-2 pt-2 border-t">
                        <div>
                          <Label className="text-xs">Position X: {template.x.toFixed(1)}%</Label>
                          <Slider
                            value={[template.x]}
                            onValueChange={([v]) => {
                              const updated = constrainTemplate({ ...template, x: v });
                              updateTemplate(template.id, { x: updated.x });
                            }}
                            min={0}
                            max={100}
                            step={0.1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Position Y: {template.y.toFixed(1)}%</Label>
                          <Slider
                            value={[template.y]}
                            onValueChange={([v]) => {
                              const updated = constrainTemplate({ ...template, y: v });
                              updateTemplate(template.id, { y: updated.y });
                            }}
                            min={0}
                            max={100}
                            step={0.1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Width: {template.width.toFixed(1)}%</Label>
                          <Slider
                            value={[template.width]}
                            onValueChange={([v]) => {
                              const updated = constrainTemplate({ ...template, width: v });
                              updateTemplate(template.id, { width: updated.width });
                            }}
                            min={5}
                            max={50}
                            step={0.1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height: {template.height.toFixed(1)}%</Label>
                          <Slider
                            value={[template.height]}
                            onValueChange={([v]) => {
                              const updated = constrainTemplate({ ...template, height: v });
                              updateTemplate(template.id, { height: updated.height });
                            }}
                            min={5}
                            max={50}
                            step={0.1}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </TabsContent>
            
            {/* Product Tab */}
            <TabsContent value="product" className="p-4 space-y-4">
              <div>
                <Label>Shirt Color</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {shirtColors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setShirtColor(color.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        shirtColor === color.hex
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Layers Tab */}
            <TabsContent value="layers" className="p-4 space-y-4">
              {svgObjects.length === 0 ? (
                <p className="text-sm text-gray-500">Upload SVG to see layers</p>
              ) : (
                <div className="space-y-2">
                  {svgObjects.map((obj) => (
                    <div key={obj.id} className="p-2 bg-gray-50 rounded flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{obj.name}</p>
                        <p className="text-xs text-gray-500">{obj.type}</p>
                      </div>
                      {obj.isApparel && <Badge variant="secondary">Apparel</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
  
  // Handle mouse move for dragging/resizing
  useEffect(() => {
    if (!isDragging && !isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && selectedTemplate && previewRef.current) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) return;
        
        const rect = previewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const updated = constrainTemplate({ ...template, x, y });
        updateTemplate(selectedTemplate, { x: updated.x, y: updated.y });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedTemplate, templates]);
  
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
      
      {/* Template Selector Dialog */}
      <TemplateSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

