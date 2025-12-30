'use client';

import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface Color {
  id: string;
  name: string;
  hexCode: string;
  pantoneCode?: string | null;
  category: string;
}

interface EnhancedColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export function EnhancedColorPicker({ label, color, onChange }: EnhancedColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [pantoneColors, setPantoneColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);
  const [customColor, setCustomColor] = useState(color);

  // Fetch Pantone colors
  useEffect(() => {
    async function fetchColors() {
      setLoading(true);
      try {
        const response = await fetch('/api/colors');
        if (response.ok) {
          const data = await response.json();
          setPantoneColors(data.colors || []);
        }
      } catch (error) {
        console.error('[EnhancedColorPicker] Error fetching colors:', error);
        toast.error('Failed to load Pantone colors');
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchColors();
    }
  }, [open]);

  // Update custom color when prop changes
  useEffect(() => {
    setCustomColor(color);
  }, [color]);

  const handlePantoneSelect = (hexCode: string) => {
    onChange(hexCode);
    setCustomColor(hexCode);
    setOpen(false);
  };

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
    onChange(newColor);
  };

  const handleCustomColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="text"
          value={color}
          onChange={handleCustomColorInput}
          className="flex-1 font-mono"
          placeholder="#000000"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-10 p-0 border-2"
              style={{ backgroundColor: color }}
              aria-label="Pick color"
            >
              <span className="sr-only">Pick color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <Tabs defaultValue="pantone" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pantone">Pantone Colors</TabsTrigger>
                <TabsTrigger value="custom">Custom Color</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pantone" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    Loading colors...
                  </div>
                ) : pantoneColors.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No Pantone colors available. Please add colors in the Colors page.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-2">
                      {pantoneColors.map((pantoneColor) => (
                        <button
                          key={pantoneColor.id}
                          onClick={() => handlePantoneSelect(pantoneColor.hexCode)}
                          className="group relative w-full aspect-square rounded-md border-2 hover:border-primary transition-all hover:scale-110"
                          style={{ backgroundColor: pantoneColor.hexCode }}
                          title={`${pantoneColor.name}${pantoneColor.pantoneCode ? ` (${pantoneColor.pantoneCode})` : ''}`}
                        >
                          {color.toLowerCase() === pantoneColor.hexCode.toLowerCase() && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={3} />
                            </div>
                          )}
                          <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-xs text-center font-medium truncate px-1">
                              {pantoneColor.pantoneCode || pantoneColor.name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-3">
                  <HexColorPicker color={customColor} onChange={handleCustomColorChange} className="w-full" />
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Hex:</Label>
                    <Input
                      type="text"
                      value={customColor}
                      onChange={handleCustomColorInput}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div 
                      className="w-20 h-20 rounded-md border-2"
                      style={{ backgroundColor: customColor }}
                    />
                    <div className="text-sm text-muted-foreground">
                      <div className="font-medium">{customColor.toUpperCase()}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
