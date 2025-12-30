import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { JSDOM } from 'jsdom';

export const dynamic = 'force-dynamic';

interface LayerModification {
  layerId: string;
  layerName: string;
  type: 'text' | 'graphic';
  value: string; // hex color or text content
}

interface PatternToAdd {
  patternId: string;
  position: string;
}

interface EmbellishmentToAdd {
  embellishmentId: string;
  position: string;
  size: number;
}

interface VariantConfig {
  layers: LayerModification[];
  patterns: PatternToAdd[];
  embellishments: EmbellishmentToAdd[];
}

// Generate all combinations from the configuration
function generateCombinations(config: VariantConfig, maxVariants: number = 20): VariantConfig[] {
  const combinations: VariantConfig[] = [];
  
  // For MVP, we'll create a single variant per unique configuration
  // In future, we can expand this to generate all possible combinations
  combinations.push(config);
  
  return combinations.slice(0, maxVariants);
}

// Apply color changes to SVG
function applyColorToSVG(svgContent: string, layerName: string, hexColor: string): string {
  const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  
  // Find elements with the matching layer name (try ID first, then data-name)
  let elements = document.querySelectorAll(`[id="${layerName}"]`);
  if (elements.length === 0) {
    elements = document.querySelectorAll(`[data-name="${layerName}"]`);
  }
  
  console.log(`[applyColorToSVG] Found ${elements.length} elements for layer "${layerName}"`);
  
  elements.forEach((element) => {
    // For groups, update all child paths/shapes
    const children = element.querySelectorAll('path, rect, circle, ellipse, polygon, polyline');
    if (children.length > 0) {
      console.log(`[applyColorToSVG] Updating ${children.length} children of "${layerName}"`);
      children.forEach((child) => {
        const currentFill = child.getAttribute('fill');
        if (!currentFill || currentFill === 'none') return;
        child.setAttribute('fill', hexColor);
      });
    } else {
      // If no children, update the element itself
      element.setAttribute('fill', hexColor);
    }
  });
  
  return dom.serialize();
}

// Apply pattern to SVG layer
function applyPatternToSVG(svgContent: string, layerName: string, patternSvgUrl: string): string {
  // For now, we'll mark the pattern layer with a data attribute
  // The actual pattern will be baked in by the Illustrator bridge
  const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  
  const elements = document.querySelectorAll(`[id="${layerName}"], [data-name="${layerName}"]`);
  
  elements.forEach((element) => {
    element.setAttribute('data-pattern', patternSvgUrl);
    // Add a visual indicator for preview (striped pattern)
    element.setAttribute('fill', 'url(#pattern-placeholder)');
  });
  
  return dom.serialize();
}

// Apply logo to slot
function applyLogoToSVG(svgContent: string, slotName: string, logoUrl: string, size: number): string {
  const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  
  const elements = document.querySelectorAll(`[id="${slotName}"], [data-name="${slotName}"]`);
  
  elements.forEach((element) => {
    element.setAttribute('data-logo', logoUrl);
    element.setAttribute('data-logo-size', size.toString());
    element.setAttribute('opacity', '0.7'); // Make it visible in preview
  });
  
  return dom.serialize();
}

// Apply font to text layer
function applyFontToSVG(svgContent: string, layerName: string, fontFamily: string): string {
  const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  
  const elements = document.querySelectorAll(`[id="${layerName}"], [data-name="${layerName}"]`);
  
  elements.forEach((element) => {
    // Update font-family attribute
    element.setAttribute('font-family', fontFamily);
    const style = element.getAttribute('style') || '';
    const newStyle = style.replace(/font-family:[^;]+;?/g, '') + ` font-family: ${fontFamily};`;
    element.setAttribute('style', newStyle);
  });
  
  return dom.serialize();
}

// Toggle team number visibility
function toggleTeamNumberInSVG(svgContent: string, visible: boolean): string {
  const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  
  const elements = document.querySelectorAll('[id*="team_number"], [data-name*="team_number"]');
  
  elements.forEach((element) => {
    element.setAttribute('opacity', visible ? '1' : '0');
    element.setAttribute('visibility', visible ? 'visible' : 'hidden');
  });
  
  return dom.serialize();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const body = await req.json();
    const config: VariantConfig = body.config;

    // Validate configuration
    if (!config) {
      return NextResponse.json({ error: 'Configuration is required' }, { status: 400 });
    }

    // Fetch the item with template
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        template: true,
        project: {
          include: {
            team: {
              include: {
                school: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (!item.template?.svgPath) {
      return NextResponse.json(
        { error: 'Template does not have an SVG file. Please upload an SVG to the template first.' },
        { status: 400 }
      );
    }

    // Fetch the template SVG content from S3
    const { getFileUrl } = await import('@/lib/s3');
    const svgUrl = await getFileUrl(item.template.svgPath, item.template.svgIsPublic || false);
    const svgResponse = await fetch(svgUrl);
    let svgContent = await svgResponse.text();

    console.log('[VARIANT-GEN] Fetched SVG content, length:', svgContent.length);
    console.log('[VARIANT-GEN] Config:', JSON.stringify(config, null, 2));

    // Fetch referenced entities (patterns, embellishments)
    const patternIds = config.patterns?.map((p) => p.patternId) || [];
    const embellishmentIds = config.embellishments?.map((e) => e.embellishmentId) || [];

    const [patterns, embellishments] = await Promise.all([
      patternIds.length > 0 ? prisma.pattern.findMany({ where: { id: { in: patternIds } } }) : Promise.resolve([]),
      embellishmentIds.length > 0 ? prisma.embellishment.findMany({ where: { id: { in: embellishmentIds } } }) : Promise.resolve([]),
    ]);

    // Create lookup maps
    const patternMap = new Map(patterns.map((p) => [p.id, p]));
    const embellishmentMap = new Map(embellishments.map((e) => [e.id, e]));

    console.log('[VARIANT-GEN] Found patterns:', patterns.length);
    console.log('[VARIANT-GEN] Found embellishments:', embellishments.length);

    // Generate combinations (for now, just one variant)
    const combinations = generateCombinations(config, 20);

    // Create variant records and generate preview SVGs
    const createdVariants = [];

    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i];
      let variantSvg = svgContent;

      console.log('[VARIANT-GEN] Processing variant', i + 1);

      // Apply layer modifications (colors and text)
      for (const layer of combination.layers || []) {
        console.log('[VARIANT-GEN] Applying layer:', layer.layerName, layer.type, layer.value);
        if (layer.type === 'graphic') {
          // Apply color to graphic layer
          variantSvg = applyColorToSVG(variantSvg, layer.layerName, layer.value);
        } else if (layer.type === 'text') {
          // Apply text content (for now, we'll just log it - full text editing needs more SVG manipulation)
          console.log('[VARIANT-GEN] Text layer:', layer.layerName, '=', layer.value);
        }
      }

      // Apply patterns
      for (const patternConfig of combination.patterns || []) {
        const pattern = patternMap.get(patternConfig.patternId);
        if (pattern && pattern.svgPath) {
          console.log('[VARIANT-GEN] Applying pattern:', pattern.name);
          const patternUrl = await getFileUrl(pattern.svgPath, pattern.svgIsPublic || false);
          variantSvg = applyPatternToSVG(variantSvg, patternConfig.position, patternUrl);
        }
      }

      // Apply embellishments (similar to logos)
      for (const embellishmentConfig of combination.embellishments || []) {
        const embellishment = embellishmentMap.get(embellishmentConfig.embellishmentId);
        if (embellishment && embellishment.svgPath) {
          console.log('[VARIANT-GEN] Applying embellishment:', embellishment.name);
          const embellishmentUrl = await getFileUrl(embellishment.svgPath, embellishment.svgIsPublic || false);
          variantSvg = applyLogoToSVG(variantSvg, embellishmentConfig.position, embellishmentUrl, embellishmentConfig.size);
        }
      }

      // Upload variant SVG to S3
      const variantFileName = `variant_${itemId}_${Date.now()}_${i}.svg`;
      const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
        variantFileName,
        'image/svg+xml',
        true
      );

      // Upload the SVG
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/svg+xml' },
        body: variantSvg,
      });

      // Generate variant name
      const variantName = `Variant ${i + 1}`;

      // Create database record
      const variant = await prisma.designVariant.create({
        data: {
          itemId,
          variantName,
          configuration: JSON.stringify(combination),
          status: 'preview',
          previewSvgPath: cloud_storage_path,
        },
      });

      createdVariants.push(variant);
    }

    return NextResponse.json({
      success: true,
      variants: createdVariants,
      message: `Generated ${createdVariants.length} variant(s)`,
    });
  } catch (error) {
    console.error('Error generating variants:', error);
    return NextResponse.json(
      { error: 'Failed to generate variants', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
