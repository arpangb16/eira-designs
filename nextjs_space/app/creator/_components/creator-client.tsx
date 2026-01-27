'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Save,
  Upload,
  Trash2,
  Palette,
  Type,
  Shirt,
  Image as ImageIcon,
  ShoppingCart,
  Plus,
  Minus,
  Users,
  Mail,
  Download,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// T-shirt designs data
const tshirtDesigns = [
  { id: 1, title: '101', image: '/creator/images/tshirt.png', template: '/creator/images/101.svg', apparelType: 'tshirt' },
  { id: 2, title: '102', image: '/creator/images/tshirt.png', apparelType: 'tshirt' },
  { id: 3, title: '103', image: '/creator/images/tshirt.png', apparelType: 'tshirt' },
  { id: 4, title: '104', image: '/creator/images/tshirt.png', apparelType: 'singlet' },
  { id: 5, title: '105', image: '/creator/images/tshirt.png', apparelType: 'shorts' },
  { id: 6, title: '106', image: '/creator/images/tshirt.png', apparelType: 'hoodie' },
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

// Standard sizes by apparel type
const sizesByApparelType: Record<string, string[]> = {
  tshirt: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  singlet: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  shorts: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  hoodie: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
  jacket: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
};

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

interface TeamMember {
  name: string;
  email: string;
}

interface School { id: string; name: string; }
interface Team { id: string; name: string; schoolId: string; }
interface Project { id: string; name: string; teamId: string; }

const defaultDesignState: DesignState = {
  shirtColor: '#FFFFFF',
  svgColors: {
    accentColor: '#ffcd00',
    text1FillColor: '#9ed9dd',
    text1OutlineColor: '#f97fb5', // Fixed: matches actual SVG stroke color
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
  const router = useRouter();
  const [selectedDesign, setSelectedDesign] = useState<typeof tshirtDesigns[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [designStates, setDesignStates] = useState<Record<number, DesignState>>({});
  const [currentState, setCurrentState] = useState<DesignState>(defaultDesignState);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  
  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Add to cart dialog state
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [sendToTeam, setSendToTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ name: '', email: '' }]);
  const [addingToCart, setAddingToCart] = useState(false);

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

  // Load schools, teams, projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolsRes, teamsRes, projectsRes] = await Promise.all([
          fetch('/api/schools'),
          fetch('/api/teams'),
          fetch('/api/projects'),
        ]);
        if (schoolsRes.ok) setSchools(await schoolsRes.json());
        if (teamsRes.ok) setTeams(await teamsRes.json());
        if (projectsRes.ok) setProjects(await projectsRes.json());
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    };
    fetchData();
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
          if (!ctx) { resolve(); return; }
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
              const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
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
                  data[i] = Math.min(255, Math.max(0, Math.round(targetR * brightnessRatio * blendFactor + r * (1 - blendFactor))));
                  data[i + 1] = Math.min(255, Math.max(0, Math.round(targetG * brightnessRatio * blendFactor + g * (1 - blendFactor))));
                  data[i + 2] = Math.min(255, Math.max(0, Math.round(targetB * brightnessRatio * blendFactor + b * (1 - blendFactor))));
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

  // Draw t-shirt to modal preview canvas when design opens or color changes
  useEffect(() => {
    if (selectedDesign?.image && previewCanvasRef.current && modalOpen) {
      applyColorToCanvas(selectedDesign.image, currentState.shirtColor, previewCanvasRef.current);
    }
  }, [selectedDesign, currentState.shirtColor, modalOpen, applyColorToCanvas]);

  // Apply SVG color and text changes
  const getModifiedSvg = useCallback(
    (originalSvg: string, state: DesignState) => {
      let svg = originalSvg;
      
      // Apply color changes
      svg = svg.replace(/#ffcd00/gi, state.svgColors.accentColor); // Accent color
      svg = svg.replace(/#9ed9dd/gi, state.svgColors.text1FillColor); // Text 1 fill (st6)
      svg = svg.replace(/#f97fb5/gi, state.svgColors.text1OutlineColor); // Text 1 stroke (st5)
      svg = svg.replace(/#cfc393/gi, state.svgColors.text2Color); // Text 2 color (st1)
      
      // Apply text content changes
      svg = svg.replace(/>HARLEM</g, `>${state.textContent.text1}<`);
      svg = svg.replace(/>WRESTLING</g, `>${state.textContent.text2}<`);
      
      // Apply text size changes - modify font-size in style definitions
      // Text 1 (Impact font, base size 278.9px)
      const text1Scale = state.textSize.text1 / 100;
      const text1FontSize = Math.round(278.9 * text1Scale);
      svg = svg.replace(/font-size:\s*278\.9px/g, `font-size: ${text1FontSize}px`);
      
      // Text 2 (Evogria font, base size 72.4px)
      const text2Scale = state.textSize.text2 / 100;
      const text2FontSize = Math.round(72.4 * text2Scale);
      svg = svg.replace(/font-size:\s*72\.4px/g, `font-size: ${text2FontSize}px`);
      
      return svg;
    },
    []
  );

  // Calculate design scale based on text size
  const getDesignScale = useCallback((state: DesignState) => {
    const avgScale = (state.textSize.text1 + state.textSize.text2) / 200;
    return avgScale;
  }, []);

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
    setCurrentState((prev) => ({ ...prev, svgColors: { ...prev.svgColors, [key]: value } }));
  };

  // Handle text change
  const handleTextChange = (key: 'text1' | 'text2', value: string) => {
    setCurrentState((prev) => ({ ...prev, textContent: { ...prev.textContent, [key]: value } }));
  };

  // Handle text size change
  const handleTextSizeChange = (key: 'text1' | 'text2', value: number) => {
    setCurrentState((prev) => ({ ...prev, textSize: { ...prev.textSize, [key]: value } }));
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

  // Export PNG with shirt composite
  const exportPNG = async () => {
    if (!selectedDesign?.image || !svgContent) {
      toast({ title: 'Error', description: 'No design to export', variant: 'destructive' });
      return;
    }
    
    setExporting(true);
    try {
      const canvas = exportCanvasRef.current;
      if (!canvas) throw new Error('Export canvas not found');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');
      
      // Set high resolution for export
      const exportWidth = 1200;
      const exportHeight = 1200;
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      
      // Clear canvas
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      
      // Load and draw the shirt with color
      const shirtImg = new Image();
      shirtImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        shirtImg.onload = () => {
          // Draw shirt centered
          const shirtScale = Math.min(exportWidth / shirtImg.width, exportHeight / shirtImg.height) * 0.9;
          const shirtW = shirtImg.width * shirtScale;
          const shirtH = shirtImg.height * shirtScale;
          const shirtX = (exportWidth - shirtW) / 2;
          const shirtY = (exportHeight - shirtH) / 2;
          
          // Create a temp canvas for color tinting
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = shirtImg.width;
          tempCanvas.height = shirtImg.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) { resolve(); return; }
          
          tempCtx.drawImage(shirtImg, 0, 0);
          
          // Apply color tint
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;
          const targetR = parseInt(currentState.shirtColor.slice(1, 3), 16);
          const targetG = parseInt(currentState.shirtColor.slice(3, 5), 16);
          const targetB = parseInt(currentState.shirtColor.slice(5, 7), 16);
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a > 10) {
              const brightness = (r + g + b) / 3;
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const saturation = max === 0 ? 0 : (max - min) / max;
              if (brightness > 70 && saturation < 0.3) {
                const brightnessRatio = brightness / 255;
                const blendFactor = 0.88;
                data[i] = Math.min(255, Math.max(0, Math.round(targetR * brightnessRatio * blendFactor + r * (1 - blendFactor))));
                data[i + 1] = Math.min(255, Math.max(0, Math.round(targetG * brightnessRatio * blendFactor + g * (1 - blendFactor))));
                data[i + 2] = Math.min(255, Math.max(0, Math.round(targetB * brightnessRatio * blendFactor + b * (1 - blendFactor))));
              }
            }
          }
          tempCtx.putImageData(imageData, 0, 0);
          
          // Draw tinted shirt to main canvas
          ctx.drawImage(tempCanvas, shirtX, shirtY, shirtW, shirtH);
          resolve();
        };
        shirtImg.onerror = () => reject(new Error('Failed to load shirt image'));
        shirtImg.src = selectedDesign.image;
      });
      
      // Draw the SVG design on top with multiply blend mode for realistic "printed on fabric" look
      const modifiedSvg = getModifiedSvg(svgContent, currentState);
      const svgBlob = new Blob([modifiedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const svgImg = new Image();
      await new Promise<void>((resolve, reject) => {
        svgImg.onload = () => {
          // Position design on chest area (18% from top, centered, 55% width)
          const designWidth = exportWidth * 0.55;
          const designHeight = (svgImg.height / svgImg.width) * designWidth;
          const designX = (exportWidth - designWidth) / 2;
          const designY = exportHeight * 0.18;
          
          // Use multiply blend mode for realistic print effect
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(svgImg, designX, designY, designWidth, designHeight);
          ctx.globalCompositeOperation = 'source-over'; // Reset to default
          URL.revokeObjectURL(svgUrl);
          resolve();
        };
        svgImg.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG'));
        };
        svgImg.src = svgUrl;
      });
      
      // Draw logo if present
      const logoSrc = currentState.logo;
      if (logoSrc) {
        const logoImg = new Image();
        await new Promise<void>((resolve) => {
          logoImg.onload = () => {
            const logoSize = 100;
            const logoX = (exportWidth - logoSize) / 2;
            const logoY = exportHeight - 120;
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            resolve();
          };
          logoImg.onerror = () => resolve();
          logoImg.src = logoSrc;
        });
      }
      
      // Download the PNG
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${selectedDesign.title || 'design'}_mockup.png`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: 'Success', description: 'Design exported as PNG!' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', description: 'Could not export the design', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // Open save dialog
  const openSaveDialog = () => {
    setSaveName(selectedDesign?.title ? `Design ${selectedDesign.title}` : 'My Design');
    setSaveDialogOpen(true);
  };

  // Save design to database
  const saveDesignToDb = async () => {
    if (!selectedDesign || !saveName.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/creator-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          schoolId: selectedSchool || null,
          teamId: selectedTeam || null,
          projectId: selectedProject || null,
          designData: currentState,
          apparelType: selectedDesign.apparelType,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Design Saved', description: 'Your design has been saved successfully.' });
      setSaveDialogOpen(false);
      // Also save locally
      const newStates = { ...designStates, [selectedDesign.id]: currentState };
      setDesignStates(newStates);
      saveToLocalStorage(newStates);
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save design', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Open add to cart dialog
  const openCartDialog = () => {
    if (!selectedDesign) return;
    const sizes = sizesByApparelType[selectedDesign.apparelType] || sizesByApparelType.tshirt;
    const initialQuantities: Record<string, number> = {};
    sizes.forEach(s => { initialQuantities[s] = 0; });
    setSizeQuantities(initialQuantities);
    setSendToTeam(false);
    setTeamMembers([{ name: '', email: '' }]);
    setCartDialogOpen(true);
  };

  // Update size quantity
  const updateSizeQuantity = (size: string, delta: number) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + delta),
    }));
  };

  // Add team member
  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, { name: '', email: '' }]);
  };

  // Remove team member
  const removeTeamMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  // Update team member
  const updateTeamMember = (index: number, field: 'name' | 'email', value: string) => {
    setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  // Add to cart
  const addToCart = async () => {
    if (!selectedDesign) return;
    
    const totalQuantity = Object.values(sizeQuantities).reduce((sum, q) => sum + q, 0);
    const validTeamMembers = teamMembers.filter(m => m.name && m.email);
    
    if (!sendToTeam && totalQuantity === 0) {
      toast({ title: 'Error', description: 'Please select at least one size', variant: 'destructive' });
      return;
    }
    
    if (sendToTeam && validTeamMembers.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one team member', variant: 'destructive' });
      return;
    }
    
    setAddingToCart(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designName: `Design ${selectedDesign.title}`,
          designData: currentState,
          apparelType: selectedDesign.apparelType,
          sizes: sendToTeam ? {} : sizeQuantities,
          unitPrice: 25.00,
          sendToTeam,
          teamMembers: sendToTeam ? validTeamMembers : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to add to cart');
      toast({ title: 'Added to Cart', description: 'Item has been added to your cart.' });
      setCartDialogOpen(false);
      setModalOpen(false);
    } catch (error) {
      console.error('Cart error:', error);
      toast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' });
    } finally {
      setAddingToCart(false);
    }
  };

  // Filter teams by school
  const filteredTeams = selectedSchool ? teams.filter(t => t.schoolId === selectedSchool) : teams;
  // Filter projects by team
  const filteredProjects = selectedTeam ? projects.filter(p => p.teamId === selectedTeam) : projects;

  // Render gallery preview
  const renderGalleryPreview = (design: typeof tshirtDesigns[0]) => {
    const state = designStates[design.id] || defaultDesignState;
    return (
      <div
        className="relative w-full h-64 flex items-center justify-center overflow-hidden bg-gray-100"
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">T-Shirt Design Creator</h1>
          <p className="text-gray-600">Click on any design to customize colors, text, and logos</p>
        </div>
        <Button onClick={() => router.push('/cart')} variant="outline">
          <ShoppingCart className="h-4 w-4 mr-2" />
          View Cart
        </Button>
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
                <div className="flex gap-2 justify-center mt-2">
                  {design.template && <Badge variant="secondary">Template</Badge>}
                  <Badge variant="outline">{design.apparelType}</Badge>
                </div>
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
                <ImageIcon className="h-4 w-4" /> Preview
              </h3>
              <div
                id="mockup-preview"
                className="relative w-full aspect-square flex items-center justify-center rounded-lg overflow-hidden bg-white"
              >
                <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain" />
                {svgContent && (
                  <div
                    className="absolute pointer-events-none design-overlay"
                    style={{ 
                      top: '18%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '55%',
                      maxWidth: '280px',
                      transition: 'all 0.2s ease-out',
                      mixBlendMode: 'multiply',
                    }}
                    dangerouslySetInnerHTML={{ __html: getModifiedSvg(svgContent, currentState) }}
                  />
                )}
                {currentState.logo && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16">
                    <img src={currentState.logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Controls Section */}
            <ScrollArea className="h-[500px] pr-4">
              <Tabs defaultValue="shirt" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="shirt"><Palette className="h-4 w-4 mr-1" />Shirt</TabsTrigger>
                  <TabsTrigger value="design"><Type className="h-4 w-4 mr-1" />Design</TabsTrigger>
                  <TabsTrigger value="logo"><ImageIcon className="h-4 w-4 mr-1" />Logo</TabsTrigger>
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
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* Design Colors Tab */}
                <TabsContent value="design" className="space-y-6 mt-4">
                  {selectedDesign?.template ? (
                    <>
                      <div className="space-y-4">
                        <h4 className="font-medium">Text Content</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Text 1</Label>
                            <Input
                              value={currentState.textContent.text1}
                              onChange={(e) => handleTextChange('text1', e.target.value)}
                            />
                            <Slider
                              value={[currentState.textSize.text1]}
                              onValueChange={([v]) => handleTextSizeChange('text1', v)}
                              min={50} max={150} step={5}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Text 2</Label>
                            <Input
                              value={currentState.textContent.text2}
                              onChange={(e) => handleTextChange('text2', e.target.value)}
                            />
                            <Slider
                              value={[currentState.textSize.text2]}
                              onValueChange={([v]) => handleTextSizeChange('text2', v)}
                              min={50} max={150} step={5}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-medium">Design Colors</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {(['accentColor', 'text1FillColor', 'text1OutlineColor', 'text2Color'] as const).map((key) => (
                            <div key={key}>
                              <Label className="text-xs">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="color"
                                  value={currentState.svgColors[key]}
                                  onChange={(e) => handleSvgColorChange(key, e.target.value)}
                                  className="w-10 h-10 rounded cursor-pointer"
                                />
                                <span className="text-xs">{currentState.svgColors[key]}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No customizable template</p>
                    </div>
                  )}
                </TabsContent>

                {/* Logo Tab */}
                <TabsContent value="logo" className="space-y-4 mt-4">
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
                    className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500"
                  >
                    <Upload className="h-5 w-5" /> Upload Logo
                  </Label>
                  {currentState.logo && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <img src={currentState.logo} alt="Logo" className="w-16 h-16 object-contain" />
                      <Button variant="destructive" size="sm" onClick={removeLogo}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <Button 
                  onClick={exportPNG} 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={exporting || !svgContent}
                >
                  {exporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Export PNG Mockup</>
                  )}
                </Button>
                <Button onClick={openSaveDialog} className="w-full" variant="outline">
                  <Save className="h-4 w-4 mr-2" /> Save Design
                </Button>
                <Button onClick={openCartDialog} className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Design Name *</Label>
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="My Design" />
            </div>
            <div>
              <Label>School (Optional)</Label>
              <Select value={selectedSchool || 'none'} onValueChange={(v) => { setSelectedSchool(v === 'none' ? '' : v); setSelectedTeam(''); setSelectedProject(''); }}>
                <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team (Optional)</Label>
              <Select value={selectedTeam || 'none'} onValueChange={(v) => { setSelectedTeam(v === 'none' ? '' : v); setSelectedProject(''); }}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project (Optional)</Label>
              <Select value={selectedProject || 'none'} onValueChange={(v) => setSelectedProject(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDesignToDb} disabled={saving}>
              {saving ? 'Saving...' : 'Save Design'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Cart Dialog */}
      <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendToTeam"
                checked={sendToTeam}
                onCheckedChange={(c) => setSendToTeam(c === true)}
              />
              <Label htmlFor="sendToTeam" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4" /> Send to team for their sizes
              </Label>
            </div>

            {!sendToTeam ? (
              <div className="space-y-3">
                <h4 className="font-medium">Select Sizes & Quantities</h4>
                {Object.keys(sizeQuantities).map((size) => (
                  <div key={size} className="flex items-center justify-between">
                    <span className="font-medium w-12">{size}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="icon"
                        onClick={() => updateSizeQuantity(size, -1)}
                        disabled={sizeQuantities[size] === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{sizeQuantities[size]}</span>
                      <Button variant="outline" size="icon" onClick={() => updateSizeQuantity(size, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Team Members
                </h4>
                {teamMembers.map((member, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => updateTeamMember(i, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={member.email}
                      onChange={(e) => updateTeamMember(i, 'email', e.target.value)}
                      className="flex-1"
                    />
                    {teamMembers.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTeamMember(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTeamMember}>
                  <Plus className="h-4 w-4 mr-1" /> Add Member
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCartDialogOpen(false)}>Cancel</Button>
            <Button onClick={addToCart} disabled={addingToCart}>
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden canvas for PNG export */}
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}
