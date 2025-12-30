'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Palette, Grid3x3, Type, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Color {
  id: string;
  name: string;
  hexCode: string;
  pantoneCode: string | null;
}

interface Pattern {
  id: string;
  name: string;
  category: string;
}

interface Font {
  id: string;
  name: string;
  fontFamily: string;
}

interface SchoolLogo {
  id: string;
  name: string;
  logoPath: string;
  isDefault: boolean;
}

interface ConfigurationTabProps {
  itemId: string;
  schoolId: string;
  onVariantsGenerated: () => void;
}

export default function ConfigurationTab({ itemId, schoolId, onVariantsGenerated }: ConfigurationTabProps) {
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<Color[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [logos, setLogos] = useState<SchoolLogo[]>([]);

  // Configuration state
  const [bodyColor, setBodyColor] = useState('');
  const [inseamColor, setInseamColor] = useState('');
  const [cuffColor, setCuffColor] = useState('');
  const [bodyPattern, setBodyPattern] = useState('');
  const [inseamPattern, setInseamPattern] = useState('');
  const [teamNameFont, setTeamNameFont] = useState('');
  const [logoFrontLarge, setLogoFrontLarge] = useState('');
  const [logoFrontSize, setLogoFrontSize] = useState([100]);
  const [logoBackSmall, setLogoBackSmall] = useState('');
  const [logoBackSize, setLogoBackSize] = useState([100]);
  const [teamNumber, setTeamNumber] = useState(false);

  // Fetch libraries
  useEffect(() => {
    async function fetchLibraries() {
      try {
        console.log('[ConfigTab] Fetching design libraries...');
        const [colorsRes, patternsRes, fontsRes, logosRes] = await Promise.all([
          fetch('/api/colors'),
          fetch('/api/patterns'),
          fetch('/api/fonts'),
          fetch(`/api/schools/${schoolId}/logos`),
        ]);

        if (colorsRes.ok) {
          const data = await colorsRes.json();
          console.log('[ConfigTab] Colors loaded:', data.colors?.length || 0);
          setColors(data.colors || []);
          if (!data.colors || data.colors.length === 0) {
            toast.error('No colors available. Please add colors to the library first.');
          }
        } else {
          console.error('[ConfigTab] Failed to fetch colors:', colorsRes.status);
          toast.error('Failed to load colors');
        }
        
        if (patternsRes.ok) {
          const data = await patternsRes.json();
          console.log('[ConfigTab] Patterns loaded:', data.patterns?.length || 0);
          setPatterns(data.patterns || []);
        } else {
          console.error('[ConfigTab] Failed to fetch patterns:', patternsRes.status);
        }
        
        if (fontsRes.ok) {
          const data = await fontsRes.json();
          console.log('[ConfigTab] Fonts loaded:', data.fonts?.length || 0);
          setFonts(data.fonts || []);
        } else {
          console.error('[ConfigTab] Failed to fetch fonts:', fontsRes.status);
        }
        
        if (logosRes.ok) {
          const data = await logosRes.json();
          console.log('[ConfigTab] Logos loaded:', data.logos?.length || 0);
          setLogos(data.logos || []);
          // Auto-select default logo
          const defaultLogo = data.logos?.find((l: SchoolLogo) => l.isDefault);
          if (defaultLogo) {
            setLogoFrontLarge(defaultLogo.id);
            setLogoBackSmall(defaultLogo.id);
          }
        } else {
          console.error('[ConfigTab] Failed to fetch logos:', logosRes.status);
        }
      } catch (error) {
        console.error('[ConfigTab] Error fetching libraries:', error);
        toast.error('Failed to load design libraries');
      }
    }

    fetchLibraries();
  }, [schoolId]);

  const handleGenerateVariants = async () => {
    // Validate required fields
    if (!bodyColor) {
      toast.error('Please select a body color');
      return;
    }

    setLoading(true);
    try {
      const config = {
        colors: [
          { layerName: 'body', colorId: bodyColor },
          ...(inseamColor ? [{ layerName: 'inseam', colorId: inseamColor }] : []),
          ...(cuffColor ? [{ layerName: 'cuff', colorId: cuffColor }] : []),
        ],
        patterns: [
          ...(bodyPattern ? [{ layerName: 'pattern_body', patternId: bodyPattern }] : []),
          ...(inseamPattern ? [{ layerName: 'pattern_inseam', patternId: inseamPattern }] : []),
        ],
        logoSlots: [
          ...(logoFrontLarge ? [{ slotName: 'logo_front_large', logoId: logoFrontLarge, size: logoFrontSize[0] }] : []),
          ...(logoBackSmall ? [{ slotName: 'logo_back_small', logoId: logoBackSmall, size: logoBackSize[0] }] : []),
        ],
        fonts: [
          ...(teamNameFont ? [{ layerName: 'team_name_position_a', fontId: teamNameFont }] : []),
        ],
        teamNumber,
      };

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
      console.error('Error generating variants:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate variants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure your design options below and click "Generate Variants" to create preview combinations.
          You can select up to 20 variants maximum.
        </AlertDescription>
      </Alert>

      {colors.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No colors available in the library. Please add colors from the Colors page (right sidebar) before configuring your design.
          </AlertDescription>
        </Alert>
      )}

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Colors
          </CardTitle>
          <CardDescription>Select colors for different parts of the design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="body-color">Body Color *</Label>
              <Select value={bodyColor} onValueChange={setBodyColor}>
                <SelectTrigger id="body-color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: color.hexCode }}
                        />
                        {color.name}
                        {color.pantoneCode && (
                          <Badge variant="outline" className="text-xs">
                            {color.pantoneCode}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inseam-color">Inseam Color</Label>
              <Select value={inseamColor} onValueChange={setInseamColor}>
                <SelectTrigger id="inseam-color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: color.hexCode }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuff-color">Cuff Color</Label>
              <Select value={cuffColor} onValueChange={setCuffColor}>
                <SelectTrigger id="cuff-color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: color.hexCode }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patterns Section */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5" />
              Patterns
            </CardTitle>
            <CardDescription>Add patterns to your design (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="body-pattern">Body Pattern</Label>
                <Select value={bodyPattern} onValueChange={setBodyPattern}>
                  <SelectTrigger id="body-pattern">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {patterns
                      .filter((p) => p.category === 'body' || p.category === 'other')
                      .map((pattern) => (
                        <SelectItem key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inseam-pattern">Inseam Pattern</Label>
                <Select value={inseamPattern} onValueChange={setInseamPattern}>
                  <SelectTrigger id="inseam-pattern">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {patterns
                      .filter((p) => p.category === 'inseam' || p.category === 'other')
                      .map((pattern) => (
                        <SelectItem key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logos Section */}
      {logos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo Positions
            </CardTitle>
            <CardDescription>Choose logo placements and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="logo-front">Front Logo (Large)</Label>
                <Select value={logoFrontLarge} onValueChange={setLogoFrontLarge}>
                  <SelectTrigger id="logo-front">
                    <SelectValue placeholder="Select logo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {logos.map((logo) => (
                      <SelectItem key={logo.id} value={logo.id}>
                        {logo.name}
                        {logo.isDefault && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Default
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {logoFrontLarge && logoFrontLarge !== 'none' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Size: {logoFrontSize[0]}%</Label>
                    </div>
                    <Slider
                      value={logoFrontSize}
                      onValueChange={setLogoFrontSize}
                      min={50}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="logo-back">Back Logo (Small)</Label>
                <Select value={logoBackSmall} onValueChange={setLogoBackSmall}>
                  <SelectTrigger id="logo-back">
                    <SelectValue placeholder="Select logo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {logos.map((logo) => (
                      <SelectItem key={logo.id} value={logo.id}>
                        {logo.name}
                        {logo.isDefault && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Default
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {logoBackSmall && logoBackSmall !== 'none' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Size: {logoBackSize[0]}%</Label>
                    </div>
                    <Slider
                      value={logoBackSize}
                      onValueChange={setLogoBackSize}
                      min={50}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text & Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Text & Typography
          </CardTitle>
          <CardDescription>Choose fonts and text options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name-font">Team Name Font</Label>
            <Select value={teamNameFont} onValueChange={setTeamNameFont}>
              <SelectTrigger id="team-name-font">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                {fonts.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <span style={{ fontFamily: font.fontFamily }}>{font.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="team-number">Include Team Number</Label>
              <p className="text-sm text-muted-foreground">Show team number on the design</p>
            </div>
            <Switch id="team-number" checked={teamNumber} onCheckedChange={setTeamNumber} />
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button onClick={handleGenerateVariants} disabled={loading || !bodyColor} size="lg">
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
