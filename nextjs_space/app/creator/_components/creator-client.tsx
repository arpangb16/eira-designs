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
  FolderPlus,
  FolderInput,
  Plus,
  Pencil,
  Save,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/file-upload';
import {
  parseTemplate,
  applyCustomizations,
  applyTextPositions,
  applyTextSizes,
  applyTextPathRotation,
  applyCircleTextSwap,
  replaceLogo,
  hideSvgBackground,
  type TemplateConfig,
  type TextElement,
  type ColorElement,
} from '@/lib/svg-template-parser';
import type { SVGLayer } from '@/lib/svg-parser-improved';

// Layer-based editor (when template has layers, e.g. Circle Badge from template 31)
interface CreatorLayerConfig {
  layerId: string;
  layerName: string;
  layerType: 'text' | 'graphic' | 'logo';
  value: string;
  logoIsPublic?: boolean;
}

// Built-in 9 templates (always available, no API needed). Order here = display order in gallery (1. first, 2. second, …).
const BUILTIN_TEMPLATE_DEFS = [
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

const BUILTIN_IDS = new Set(BUILTIN_TEMPLATE_DEFS.map((t) => t.id));

/** Strip SVG/tags from string so we never show raw markup in text inputs */
function plainTextForDisplay(s: string): string {
  if (typeof s !== 'string') return '';
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || s;
}

interface CreatorTemplateDef {
  id: string;
  name: string;
  svgPath: string;
  isPublic?: boolean;
}

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
  /** Position offset per text content (e.g. move "WRESTLING" left/right or up/down) */
  textPositions: Record<string, { x: number; y: number }>;
  /** Text size scale per content (1 = 100%, 0.5 = 50%, 2 = 200%) */
  textSizes: Record<string, number>;
  designScale: number;
  designX: number;
  designY: number;
  customLogo: string | null;
}

interface CreatorLayerConfig {
  layerId: string;
  layerName: string;
  layerType: 'text' | 'graphic' | 'logo';
  value: string;
  logoIsPublic?: boolean;
}

const defaultEditorState: EditorState = {
  shirtColor: '#FFFFFF',
  textChanges: {},
  colorChanges: {},
  textPositions: {},
  textSizes: {},
  designScale: 100,
  designX: 50,
  designY: 16,
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
  const [addingToTemplate, setAddingToTemplate] = useState(false);
  const [migratingAll, setMigratingAll] = useState(false);
  const [addImageOpen, setAddImageOpen] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [addingImage, setAddingImage] = useState(false);
  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deleteTemplateName, setDeleteTemplateName] = useState('');
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  /** When template has layers (e.g. Circle Badge from template 31), per-layer config */
  const [layerConfigs, setLayerConfigs] = useState<Record<string, CreatorLayerConfig>>({});
  // Save-as-product dialog state
  const [saveProductOpen, setSaveProductOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  // Saved products list dialog
  const [savedProductsOpen, setSavedProductsOpen] = useState(false);
  const [savedProductsLoading, setSavedProductsLoading] = useState(false);
  const [savedProducts, setSavedProducts] = useState<
    { id: string; name: string; apparelType: string; createdAt: string }[]
  >([]);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  /** When editing an existing saved product, its id (enables Update instead of Save) */
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  // Delete product confirmation
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState('');
  const [deletingProduct, setDeletingProduct] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  /** When true, run exportPNG after the template SVG has finished loading (used by Saved Products download) */
  const exportAfterLoadRef = useRef(false);
  const exportPNGRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Flatten layers for display (top-level + text/colorable/logo)
  function flattenLayersForCreator(layers: SVGLayer[]): SVGLayer[] {
    const result: SVGLayer[] = [];
    function hasFill(l: SVGLayer): boolean {
      if (l.fill) return true;
      return (l.children ?? []).some((c) => hasFill(c));
    }
    function isLogoLike(l: SVGLayer): boolean {
      const name = (l.name || l.id || '').toLowerCase();
      return name.includes('logo') || name.includes('emblem') || l.type === 'image';
    }
    layers.forEach((layer) => {
      if (layer.type === 'text' || layer.content) result.push(layer);
      else if (layer.type === 'group' && (layer.children?.length ?? 0) > 0 && (hasFill(layer) || isLogoLike(layer))) result.push(layer);
      else if (layer.fill && (!layer.children || layer.children.length === 0)) result.push(layer);
      else if (isLogoLike(layer)) result.push(layer);
    });
    return result;
  }

  function initializeLayerConfigForCreator(layer: SVGLayer, configs: Record<string, CreatorLayerConfig>) {
    const isText = layer.type === 'text' || !!layer.content;
    const isLogo = (layer.name || layer.id || '').toLowerCase().includes('logo') || (layer.name || layer.id || '').toLowerCase().includes('emblem') || layer.type === 'image';
    let layerType: 'text' | 'graphic' | 'logo' = 'graphic';
    let value = '';
    if (isLogo) {
      layerType = 'logo';
    } else if (isText) {
      layerType = 'text';
      value = layer.content || '';
    } else {
      layerType = 'graphic';
      value = layer.fill ?? '#000000';
      if (!layer.fill && layer.children?.length) {
        const first = layer.children.find((c) => c.fill);
        if (first) value = first.fill ?? '#000000';
      }
    }
    configs[layer.id] = {
      layerId: layer.id,
      layerName: layer.name || layer.id,
      layerType,
      value,
      logoIsPublic: isLogo ? true : undefined,
    };
    (layer.children ?? []).forEach((c) => initializeLayerConfigForCreator(c, configs));
  }

  // Apply layer configs to SVG string (same logic as Visual Editor, sync for text/graphic only)
  function applyLayerConfigsToSvg(svgContent: string, configs: Record<string, CreatorLayerConfig>): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    for (const config of Object.values(configs)) {
      let elements = doc.querySelectorAll(`[id="${config.layerId}"]`);
      if (elements.length === 0) elements = doc.querySelectorAll(`[data-name="${config.layerId}"]`);
      for (const element of Array.from(elements)) {
        if (config.layerType === 'text') {
          const escaped = String(config.value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          const textPath = element.querySelector('textPath') ?? (element.tagName?.toLowerCase() === 'textpath' ? element : null);
          if (textPath) {
            const tspan = textPath.querySelector('tspan');
            if (tspan) tspan.textContent = escaped;
            else textPath.textContent = escaped;
          } else if (element.tagName?.toLowerCase() === 'text' || element.tagName?.toLowerCase() === 'tspan') {
            element.textContent = escaped;
          } else {
            const textEl = element.querySelector('text');
            const innerPath = textEl?.querySelector('textPath');
            if (innerPath) {
              const innerTspan = innerPath.querySelector('tspan');
              if (innerTspan) innerTspan.textContent = escaped;
              else innerPath.textContent = escaped;
            } else if (textEl) textEl.textContent = escaped;
          }
        } else if (config.layerType === 'graphic') {
          const children = element.querySelectorAll('path, rect, circle, ellipse, polygon, polyline');
          if (children.length > 0) {
            children.forEach((child) => {
              const fill = child.getAttribute('fill');
              if (fill && fill !== 'none') child.setAttribute('fill', config.value);
            });
          } else {
            const fill = element.getAttribute('fill');
            if (fill && fill !== 'none') element.setAttribute('fill', config.value);
          }
        }
        // logo: skip async embed in Creator for now
      }
    }
    return new XMLSerializer().serializeToString(doc);
  }

  // Load templates: 9 built-in (always) + any custom from API
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const loadedTemplates: TemplateConfig[] = [];

    // 1. Load built-in 9 templates (always available)
    for (const def of BUILTIN_TEMPLATE_DEFS) {
      try {
        const response = await fetch(def.svgPath);
        const content = await response.text();
        const config = parseTemplate(content, def.id, def.name, def.svgPath);
        loadedTemplates.push(config);
      } catch (error) {
        console.error(`Failed to load template ${def.id}:`, error);
      }
    }

    // 2. If template "31" exists in DB (Templates), use it for Circle Badge (103) so we get layers
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const list: { id: string; name: string; svgPath: string | null; svgIsPublic?: boolean; layerData: string | null }[] = await res.json();
        const t31 = list.find((t) => t.name === '31');
        if (t31?.svgPath && t31?.layerData) {
          try {
            let svgUrl: string;
            if (t31.svgPath.startsWith('/creator/') || t31.svgPath.startsWith('uploads/')) {
              const p = t31.svgPath.startsWith('/') ? t31.svgPath : `/${t31.svgPath}`;
              svgUrl = typeof window !== 'undefined' ? `${window.location.origin}${p}` : p;
            } else {
              const urlRes = await fetch('/api/upload/file-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cloud_storage_path: t31.svgPath,
                  isPublic: t31.svgIsPublic ?? true,
                }),
              });
              if (!urlRes.ok) throw new Error('Failed to get SVG URL');
              const { url } = await urlRes.json();
              svgUrl = url;
            }
            const response = await fetch(svgUrl);
            const content = await response.text();
            const config = parseTemplate(content, '103', 'Circle Badge', t31.svgPath);
            const parsed = JSON.parse(t31.layerData) as { layers?: { id: string; name: string; type: string; content?: string; fill?: string; children?: unknown[] }[] };
            config.layers = (parsed.layers ?? []) as TemplateConfig['layers'];
            const idx = loadedTemplates.findIndex((c) => c.id === '103');
            if (idx >= 0) loadedTemplates[idx] = config;
          } catch (err) {
            console.error('Failed to load Circle Badge from template 31:', err);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates for Circle Badge:', error);
    }

    // 3. Fetch and load custom templates from API (added via "Add New Image")
    try {
      const res = await fetch('/api/creator/templates');
      if (res.ok) {
        const defs: CreatorTemplateDef[] = await res.json();
        const builtinPaths = new Set(BUILTIN_TEMPLATE_DEFS.map((t) => t.svgPath));
        for (const def of defs) {
          if (builtinPaths.has(def.svgPath)) continue; // already loaded
          try {
            let svgUrl: string;
            if (def.svgPath.startsWith('/creator/') || def.svgPath.startsWith('uploads/')) {
              const p = def.svgPath.startsWith('/') ? def.svgPath : `/${def.svgPath}`;
              svgUrl = typeof window !== 'undefined' ? `${window.location.origin}${p}` : p;
            } else {
              const urlRes = await fetch('/api/upload/file-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cloud_storage_path: def.svgPath,
                  isPublic: def.isPublic ?? true,
                }),
              });
              if (!urlRes.ok) continue;
              const { url } = await urlRes.json();
              svgUrl = url;
            }
            const response = await fetch(svgUrl);
            const content = await response.text();
            const config = parseTemplate(content, def.id, def.name, def.svgPath);
            loadedTemplates.push(config);
          } catch (error) {
            console.error(`Failed to load custom template ${def.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch custom templates:', error);
      // Built-in 9 are already loaded, so we don't show error
    }

    setTemplates(loadedTemplates);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Load SVG content when template is selected
  useEffect(() => {
    if (!selectedTemplate) return;
    const loadSvg = async () => {
      try {
        let url: string;
        if (selectedTemplate.svgPath.startsWith('/creator/')) {
          url = selectedTemplate.svgPath;
        } else {
          const res = await fetch('/api/upload/file-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cloud_storage_path: selectedTemplate.svgPath,
              isPublic: true,
            }),
          });
          if (!res.ok) throw new Error('Failed to get SVG URL');
          const { url: fileUrl } = await res.json();
          url = fileUrl;
        }
        const response = await fetch(url);
        const content = await response.text();
        setSvgContent(content);
        if (exportAfterLoadRef.current) {
          exportAfterLoadRef.current = false;
          setTimeout(() => exportPNGRef.current(), 200);
        }
      } catch (err) {
        console.error('Failed to load SVG:', err);
        exportAfterLoadRef.current = false;
      }
    };
    loadSvg();
  }, [selectedTemplate]);

  // Select a template and open editor
  const selectTemplate = (template: TemplateConfig) => {
    setEditingProductId(null);
    setSelectedTemplate(template);
    if (template.layers?.length) {
      const flat = flattenLayersForCreator(template.layers);
      const configs: Record<string, CreatorLayerConfig> = {};
      flat.forEach((layer) => initializeLayerConfigForCreator(layer, configs));
      setLayerConfigs(configs);
    } else {
      setLayerConfigs({});
    }
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
      textPositions: {},
    });
    setView('editor');
  };

  // Go back to gallery
  const backToGallery = () => {
    setView('gallery');
    setSelectedTemplate(null);
    setSvgContent('');
    setEditorState(defaultEditorState);
    setLayerConfigs({});
    setEditingProductId(null);
  };

  // Get modified SVG with customizations
  const getModifiedSvg = useCallback(() => {
    if (!svgContent) return '';

    // Layer-based template (e.g. Circle Badge from template 31): apply layer configs only
    if (selectedTemplate?.layers?.length && Object.keys(layerConfigs).length > 0) {
      return hideSvgBackground(replaceLogo(applyLayerConfigsToSvg(svgContent, layerConfigs), !!editorState.customLogo));
    }

    // Circle Badge: don't global-replace circle text (would overwrite); use applyCircleTextSwap after
    let textChanges = editorState.textChanges;
    const circleEls =
      selectedTemplate?.hasCircleText && selectedTemplate.textElements?.length === 2
        ? selectedTemplate.textElements.filter((e) => e.pathId === 'path' || e.pathId === 'path1')
        : [];
    if (circleEls.length === 2) {
      const [el0, el1] = circleEls;
      const omit = new Set([el0.content, el1.content]);
      textChanges = Object.fromEntries(
        Object.entries(editorState.textChanges).filter(([k]) => !omit.has(k))
      );
    }

    let modified = applyCustomizations(
      svgContent,
      textChanges,
      editorState.colorChanges,
      selectedTemplate?.textElements
    );

    if (selectedTemplate?.hasCircleText && circleEls.length === 2) {
      modified = applyCircleTextSwap(modified, selectedTemplate.textElements, editorState.textChanges);
    }

    modified = applyTextPositions(
      modified,
      editorState.textPositions,
      selectedTemplate?.textElements,
      editorState.textChanges
    );

    modified = applyTextSizes(
      modified,
      editorState.textSizes,
      selectedTemplate?.textElements,
      editorState.textChanges
    );

    if (selectedTemplate?.hasCircleText) {
      modified = applyTextPathRotation(modified, { path: 'top', path1: 'bottom' });
    }
    
    // Hide original logo if custom logo is set
    if (editorState.customLogo) {
      modified = replaceLogo(modified, true);
    }

    // Hide background layers so design shows on shirt only (no full-page background)
    modified = hideSvgBackground(modified);

    return modified;
  }, [svgContent, editorState, selectedTemplate?.textElements, selectedTemplate?.layers, layerConfigs]);

  // Handle text change
  const handleTextChange = (originalText: string, newText: string) => {
    setEditorState(prev => ({
      ...prev,
      textChanges: { ...prev.textChanges, [originalText]: newText },
    }));
  };

  // Handle text position (move text by offset in SVG units)
  const handleTextPosition = (content: string, axis: 'x' | 'y', value: number) => {
    setEditorState(prev => {
      const current = prev.textPositions[content] ?? { x: 0, y: 0 };
      return {
        ...prev,
        textPositions: {
          ...prev.textPositions,
          [content]: { ...current, [axis]: value },
        },
      };
    });
  };

  // Handle text size (scale factor: 1 = 100%, 0.5 = 50%, 2 = 200%)
  const handleTextSize = (content: string, scale: number) => {
    setEditorState(prev => ({
      ...prev,
      textSizes: { ...prev.textSizes, [content]: scale },
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
  const handleLayerConfigChange = (layerId: string, value: string) => {
    setLayerConfigs((prev) => ({
      ...prev,
      [layerId]: { ...prev[layerId], value },
    }));
  };

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
    if (selectedTemplate.layers?.length) {
      const flat = flattenLayersForCreator(selectedTemplate.layers);
      const configs: Record<string, CreatorLayerConfig> = {};
      flat.forEach((layer) => initializeLayerConfigForCreator(layer, configs));
      setLayerConfigs(configs);
    } else {
      setLayerConfigs({});
    }
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
      textPositions: {},
    });
  };

  const openSaveProduct = () => {
    if (!selectedTemplate) return;
    setProductName(selectedTemplate.name);
    setSaveProductOpen(true);
  };

  const openSavedProducts = async () => {
    setSavedProductsOpen(true);
    if (savedProducts.length > 0) return;
    setSavedProductsLoading(true);
    try {
      const res = await fetch('/api/creator/designs');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load saved products');
      }
      setSavedProducts(data.designs || []);
    } catch (error) {
      console.error('[Creator] Failed to load saved products', error);
      toast({
        title: 'Failed to load saved products',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavedProductsLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedTemplate) return;
    setSavingProduct(true);
    try {
      const designData = {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        templateSvgPath: selectedTemplate.svgPath,
        shirtColor: editorState.shirtColor,
        designScale: editorState.designScale,
        designX: editorState.designX,
        designY: editorState.designY,
        textChanges: editorState.textChanges,
        colorChanges: editorState.colorChanges,
        textPositions: editorState.textPositions,
        textSizes: editorState.textSizes,
        hasCircleText: selectedTemplate.hasCircleText,
        layers: selectedTemplate.layers ?? null,
        layerConfigs: Object.values(layerConfigs),
      };

      const name = productName || selectedTemplate.name;
      const payload = { name, designData, apparelType: 'tshirt' as const };

      if (editingProductId) {
        const res = await fetch(`/api/creator/designs/${editingProductId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to update product');
        }
        toast({
          title: 'Product updated',
          description: 'Your design has been updated.',
        });
        setEditingProductId(null);
      } else {
        const res = await fetch('/api/creator/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to save product');
        }
        toast({
          title: 'Product saved',
          description: 'Your design has been saved under Creator → Saved Products.',
        });
      }

      setSaveProductOpen(false);
      setSavedProducts([]);
    } catch (error) {
      console.error('[Creator] Failed to save product', error);
      toast({
        title: editingProductId ? 'Failed to update product' : 'Failed to save product',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteSavedProduct = async (id: string) => {
    setDeletingProduct(true);
    try {
      const res = await fetch(`/api/creator/designs/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete product');
      }
      setSavedProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteProductId(null);
      setDeleteProductName('');
      toast({
        title: 'Product deleted',
        description: 'The saved product has been removed.',
      });
    } catch (error) {
      console.error('[Creator] Failed to delete product', error);
      toast({
        title: 'Failed to delete product',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDeletingProduct(false);
    }
  };

  const loadSavedProduct = async (productId: string, options?: { andExport?: boolean }) => {
    setLoadingProductId(productId);
    try {
      const res = await fetch(`/api/creator/designs?id=${productId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load product');
      }
      const design = data.design as {
        id: string;
        name: string;
        designData: string;
      };
      if (!design?.designData) {
        throw new Error('Saved product has no design data');
      }
      const parsed = JSON.parse(design.designData);
      const {
        templateId,
        templateSvgPath,
        shirtColor,
        designScale,
        designX,
        designY,
        textChanges = {},
        colorChanges = {},
        textPositions = {},
        textSizes = {},
        layerConfigs: savedLayerConfigs = [],
      } = parsed || {};

      const template =
        templates.find((t) => t.id === templateId) ||
        templates.find((t) => t.svgPath === templateSvgPath);
      if (!template) {
        throw new Error('Template for this product is not available in Creator');
      }

      // Initialize editor state from template + saved overrides
      const baseTextChanges: Record<string, string> = {};
      template.textElements.forEach((el) => {
        const override = (textChanges && textChanges[el.content]) || el.content;
        baseTextChanges[el.content] = override;
      });

      const baseColorChanges: Record<string, string> = {};
      template.colorElements.forEach((el) => {
        const override = (colorChanges && colorChanges[el.color]) || el.color;
        baseColorChanges[el.color] = override;
      });

      setSelectedTemplate(template);
      setEditorState({
        ...defaultEditorState,
        shirtColor: shirtColor || defaultEditorState.shirtColor,
        designScale: typeof designScale === 'number' ? designScale : defaultEditorState.designScale,
        designX: typeof designX === 'number' ? designX : defaultEditorState.designX,
        designY: typeof designY === 'number' ? designY : defaultEditorState.designY,
        textChanges: baseTextChanges,
        colorChanges: baseColorChanges,
        textPositions: textPositions || {},
        textSizes: textSizes || {},
      });

      if (template.layers?.length && Array.isArray(savedLayerConfigs)) {
        const cfg: Record<string, CreatorLayerConfig> = {};
        (savedLayerConfigs as CreatorLayerConfig[]).forEach((c) => {
          cfg[c.layerId] = c;
        });
        setLayerConfigs(cfg);
      } else {
        setLayerConfigs({});
      }

      setEditingProductId(design.id);
      setProductName(design.name);
      setView('editor');
      setSavedProductsOpen(false);
      if (options?.andExport) {
        exportAfterLoadRef.current = true;
      }
    } catch (error) {
      console.error('[Creator] Failed to load product', error);
      toast({
        title: 'Failed to load product',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoadingProductId(null);
    }
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
      
      // Start with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // Load mask image first
      const maskImg = new Image();
      maskImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        maskImg.onload = () => resolve();
        maskImg.onerror = reject;
        maskImg.src = '/creator/images/tshirt-mask.png';
      });
      
      // Calculate dimensions for centered shirt
      const scale = Math.min(size / maskImg.width, size / maskImg.height) * 0.9;
      const w = maskImg.width * scale;
      const h = maskImg.height * scale;
      const x = (size - w) / 2;
      const y = (size - h) / 2;
      
      // Create color layer with mask
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = size;
      colorCanvas.height = size;
      const colorCtx = colorCanvas.getContext('2d')!;
      
      // Draw the mask
      colorCtx.drawImage(maskImg, x, y, w, h);
      
      // Use composite to fill only the mask area with color
      colorCtx.globalCompositeOperation = 'source-in';
      colorCtx.fillStyle = editorState.shirtColor;
      colorCtx.fillRect(0, 0, size, size);
      
      // Draw color layer to main canvas
      ctx.drawImage(colorCanvas, 0, 0);
      
      // Load and draw t-shirt texture with multiply blend
      const shirtImg = new Image();
      shirtImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        shirtImg.onload = () => {
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(shirtImg, x, y, w, h);
          ctx.globalCompositeOperation = 'source-over';
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
          // Chest ellipse (match preview): center 50% 42%, radii 55% 42% of shirt rect
          const cx = x + w / 2;
          const cy = y + h * 0.42;
          const rx = w * 0.55;
          const ry = h * 0.42;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          ctx.clip();
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(svgImg, designX, designY, designW, designH);
          ctx.globalCompositeOperation = 'source-over';
          ctx.restore();
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

  exportPNGRef.current = exportPNG;

  // Add current template to Template library
  const addToTemplate = async () => {
    if (!selectedTemplate) return;
    setAddingToTemplate(true);
    try {
      const res = await fetch('/api/creator/add-to-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          svgPath: selectedTemplate.svgPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }
      toast({ title: 'Success', description: `${selectedTemplate.name} added to Templates!` });
      router.push('/templates');
      router.refresh();
    } catch (error) {
      console.error('Add to template error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add to Templates',
        variant: 'destructive',
      });
    } finally {
      setAddingToTemplate(false);
    }
  };

  // Add new image as creator template (from upload)
  const handleNewImageUpload = async (cloud_storage_path: string, isPublic: boolean) => {
    if (!newImageName.trim()) {
      toast({
        title: 'Enter template name',
        description: 'Please enter a template name before uploading.',
        variant: 'destructive',
      });
      return;
    }
    setAddingImage(true);
    try {
      const res = await fetch('/api/creator/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newImageName.trim(),
          cloud_storage_path,
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }
      toast({ title: 'Success', description: `${newImageName} added as template!` });
      setAddImageOpen(false);
      setNewImageName('');
      loadTemplates();
    } catch (error) {
      console.error('Add new image error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add template',
        variant: 'destructive',
      });
    } finally {
      setAddingImage(false);
    }
  };

  // Edit custom template name
  const openEditTemplate = (template: TemplateConfig) => {
    setEditTemplateId(template.id);
    setEditTemplateName(template.name);
    setEditTemplateOpen(true);
  };

  const saveEditTemplate = async () => {
    if (!editTemplateId || !editTemplateName.trim()) return;
    setEditingTemplate(true);
    try {
      const res = await fetch(`/api/creator/template/${editTemplateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTemplateName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Success', description: 'Template updated' });
      setEditTemplateOpen(false);
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update',
        variant: 'destructive',
      });
    } finally {
      setEditingTemplate(false);
    }
  };

  // Delete custom template
  const openDeleteConfirm = (template: TemplateConfig) => {
    setDeleteTemplateId(template.id);
    setDeleteTemplateName(template.name);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    setDeletingTemplate(true);
    try {
      const res = await fetch(`/api/creator/template/${deleteTemplateId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed');
      }
      toast({ title: 'Success', description: 'Template deleted' });
      setDeleteConfirmOpen(false);
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete',
        variant: 'destructive',
      });
    } finally {
      setDeletingTemplate(false);
    }
  };

  // One-time migration: add all creator templates to Template library
  const migrateAllToTemplates = async () => {
    setMigratingAll(true);
    try {
      const res = await fetch('/api/creator/migrate-to-templates', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed');
      }
      toast({
        title: 'Migration complete',
        description: `Added ${data.created} templates. ${data.skipped} already existed.`,
      });
      router.push('/templates');
      router.refresh();
    } catch (error) {
      console.error('Migrate error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to migrate',
        variant: 'destructive',
      });
    } finally {
      setMigratingAll(false);
    }
  };

  // Render Gallery View
  const renderGallery = () => (
    <div className="p-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Design Templates</h1>
          <p className="text-gray-600 mt-2">Choose a template to customize for your team</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" onClick={openSavedProducts}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Saved Products
          </Button>
          <Button variant="outline" onClick={() => setAddImageOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Image
          </Button>
          <Button
            variant="outline"
            onClick={migrateAllToTemplates}
            disabled={migratingAll}
          >
            {migratingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FolderInput className="h-4 w-4 mr-2" />
            )}
            {migratingAll ? 'Migrating...' : 'Migrate All to Templates'}
          </Button>
        </div>
      </div>

      {/* Saved products dialog */}
      <Dialog open={savedProductsOpen} onOpenChange={setSavedProductsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Products</DialogTitle>
            <p className="text-sm text-muted-foreground">
              These are products you saved from the Creator using &quot;Save Product&quot;.
            </p>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto mt-2">
            {savedProductsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading products…</span>
              </div>
            ) : savedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                You don&apos;t have any saved products yet. Customize a template and click &quot;Save Product&quot; to create one.
              </p>
            ) : (
              <ul className="space-y-2">
                {savedProducts.map((p) => {
                  const isLoading = loadingProductId === p.id;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                      onClick={() => !isLoading && loadSavedProduct(p.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleString()} · {p.apparelType}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => loadSavedProduct(p.id, { andExport: true })}
                          disabled={isLoading}
                          title="Download as PNG"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setDeleteProductId(p.id);
                            setDeleteProductName(p.name);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavedProductsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete saved product confirmation */}
      <Dialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Delete &quot;{deleteProductName}&quot;? This cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProductId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProductId && deleteSavedProduct(deleteProductId)}
              disabled={deletingProduct}
            >
              {deletingProduct ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit template dialog */}
      <Dialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={editTemplateName}
                onChange={(e) => setEditTemplateName(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEditTemplate} disabled={editingTemplate || !editTemplateName.trim()}>
                {editingTemplate ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Delete &quot;{deleteTemplateName}&quot;? This cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTemplate} disabled={deletingTemplate}>
              {deletingTemplate ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {templates.map((template) => {
            const isCustom = !BUILTIN_IDS.has(template.id);
            const builtinIndex = BUILTIN_TEMPLATE_DEFS.findIndex((t) => t.id === template.id);
            const templateNumber = builtinIndex >= 0 ? builtinIndex + 1 : null;
            return (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <Card
                  className="cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => selectTemplate(template)}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    <div className="absolute inset-4">
                      <img
                        src={template.svgPath.startsWith('/') ? template.svgPath : `/${template.svgPath}`}
                        alt={template.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {isCustom && (
                      <div
                        className="absolute top-2 right-2 flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTemplate(template);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(template);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t">
                    <h3 className="font-semibold text-center">
                      {templateNumber != null && <span className="text-muted-foreground mr-1">{templateNumber}.</span>}
                      {template.name}
                    </h3>
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
            );
          })}
        </div>
      )}
    </div>
  );

  // Render Editor View
  const renderEditor = () => {
    if (!selectedTemplate) return null;

    let modifiedSvg = '';
    try {
      modifiedSvg = getModifiedSvg() || svgContent || '';
    } catch (e) {
      console.error('getModifiedSvg failed:', e);
      modifiedSvg = svgContent || '';
    }
    
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
              variant="outline"
              size="sm"
              onClick={openSaveProduct}
              disabled={savingProduct}
            >
              {savingProduct ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {editingProductId ? 'Update Product' : 'Save Product'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addToTemplate}
              disabled={addingToTemplate}
            >
              {addingToTemplate ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4 mr-1" />
              )}
              Add to Template
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
      
      {/* Save Product dialog */}
      <Dialog open={saveProductOpen} onOpenChange={setSaveProductOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingProductId ? 'Update Product' : 'Save Product'}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingProductId
                ? 'Update the name or design of this saved product.'
                : 'Save this customized design as a reusable product.'}
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mt-2"
                placeholder="e.g. Southwest Wrestling Tee"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={savingProduct || !productName.trim()}>
              {savingProduct ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingProductId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              }}
            >
              {/* Color Layer - masked to shirt shape */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: editorState.shirtColor,
                  WebkitMaskImage: 'url(/creator/images/tshirt-mask.png)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskPosition: 'center',
                  WebkitMaskRepeat: 'no-repeat',
                  maskImage: 'url(/creator/images/tshirt-mask.png)',
                  maskSize: 'contain',
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat',
                }}
              />
              
              {/* T-Shirt Base with texture/shadows */}
              <img
                src="/creator/images/tshirt.png"
                alt="T-Shirt"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  mixBlendMode: 'multiply',
                }}
              />
              
              {/* Chest-area clip: design stays within shirt front only */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: 'ellipse(55% 42% at 50% 42%)',
                  WebkitClipPath: 'ellipse(55% 42% at 50% 42%)',
                }}
              >
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
              </div>
              
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
                  <div className="flex items-center gap-2 mt-2">
                    <Slider
                      value={[editorState.designY]}
                      onValueChange={([v]) => handleDesignPosition('designY', v)}
                      min={15}
                      max={60}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm tabular-nums w-10">{editorState.designY}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Top</span>
                    <span>Bottom</span>
                  </div>
                </div>
              </TabsContent>
              
              {/* Text Tab */}
              <TabsContent value="text" className="p-4 space-y-4">
                <p className="text-xs text-gray-500 mb-2">Change the text in this design (team name, sport, etc.).</p>
                {selectedTemplate.layers?.length ? (
                  /* Layer-based editor (e.g. Circle Badge from template 31) */
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">Edit each layer below. Text layers and graphic (color) layers are supported.</p>
                    {Object.values(layerConfigs).map((config) => (
                      <div key={config.layerId} className="space-y-2 border-b pb-4 last:border-0">
                        <Label className="text-sm font-medium">{config.layerName}</Label>
                        {config.layerType === 'text' && (
                          <Input
                            value={config.value}
                            onChange={(e) => handleLayerConfigChange(config.layerId, e.target.value)}
                            placeholder="Text"
                            className="mt-1"
                          />
                        )}
                        {config.layerType === 'graphic' && (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="color"
                              value={config.value}
                              onChange={(e) => handleLayerConfigChange(config.layerId, e.target.value)}
                              className="w-10 h-9 rounded border cursor-pointer"
                            />
                            <Input
                              value={config.value}
                              onChange={(e) => handleLayerConfigChange(config.layerId, e.target.value)}
                              className="flex-1 font-mono text-sm"
                              placeholder="#000000"
                            />
                          </div>
                        )}
                        {config.layerType === 'logo' && (
                          <p className="text-xs text-muted-foreground">Logo layer: use Items → Visual Editor to replace with upload.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : selectedTemplate.textElements.length > 0 ? (
                  selectedTemplate.textElements.map((textEl, idx) => {
                    const pos = editorState.textPositions[textEl.content] ?? { x: 0, y: 0 };
                    const sizeScale = editorState.textSizes[textEl.content] ?? 1;
                    const circleLabel =
                      selectedTemplate.hasCircleText && textEl.pathId
                        ? textEl.pathId === 'path1'
                          ? ' (top arc)'
                          : ' (bottom arc)'
                        : '';
                    return (
                      <div key={idx} className="space-y-2 border-b pb-4 last:border-0">
                        <Label className="text-sm font-medium">Text {idx + 1}{circleLabel}</Label>
                        <Input
                          value={plainTextForDisplay(editorState.textChanges[textEl.content] ?? textEl.content)}
                          onChange={(e) => handleTextChange(textEl.content, e.target.value)}
                          className="mt-1"
                          placeholder={plainTextForDisplay(textEl.content)}
                        />
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">Size</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Slider
                              value={[Math.round(sizeScale * 100)]}
                              onValueChange={([v]) => handleTextSize(textEl.content, v / 100)}
                              min={50}
                              max={200}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm tabular-nums w-10">{Math.round(sizeScale * 100)}%</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">Position</Label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div>
                              <span className="text-xs text-muted-foreground block">Horizontal</span>
                              <Slider
                                value={[pos.x]}
                                onValueChange={([v]) => handleTextPosition(textEl.content, 'x', v)}
                                min={-200}
                                max={200}
                                step={5}
                                className="mt-0.5"
                              />
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">Vertical</span>
                              <Slider
                                value={[pos.y]}
                                onValueChange={([v]) => handleTextPosition(textEl.content, 'y', v)}
                                min={-200}
                                max={200}
                                step={5}
                                className="mt-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                  <p className="text-xs text-gray-500 mt-1">
                    Replace the default logo (animal, bird, or emblem) with your own. PNG or SVG recommended.
                  </p>
                  
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
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-gray-500">
                      This template has a default logo (e.g. animal or bird). Your upload replaces it on the design.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            {/* Add template from right menu */}
            <div className="border-t p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAddImageOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Template
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Upload an image to add it to the template gallery
              </p>
            </div>
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

      {/* Add New Template dialog (available from gallery and editor) */}
      <Dialog open={addImageOpen} onOpenChange={(open) => {
        if (!open) setNewImageName('');
        setAddImageOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Template</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Upload an SVG or image to add it as a creator template. It will appear in the template gallery.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g. My Design"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                className="mt-2"
              />
            </div>
            <FileUpload
              label="SVG or Image File"
              accept=".svg,image/svg+xml,.png,image/png,.jpg,.jpeg,image/jpeg"
              isPublic={true}
              maxSize={10}
              onUploadComplete={handleNewImageUpload}
            />
            {addingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding template...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
