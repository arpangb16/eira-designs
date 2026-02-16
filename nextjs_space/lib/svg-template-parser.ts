// SVG Template Parser - Auto-detects editable elements from SVG templates

export interface TextElement {
  id: string;
  groupId: string;
  content: string;
  className: string;
  transform: string;
}

export interface ColorElement {
  className: string;
  property: 'fill' | 'stroke';
  color: string;
  name: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  svgPath: string;
  textElements: TextElement[];
  colorElements: ColorElement[];
  hasLogo: boolean;
  hasPattern: boolean;
  hasLines: boolean;
}

// Extract text content from SVG text elements
export function extractTextElements(svgContent: string): TextElement[] {
  const textElements: TextElement[] = [];
  
  // Find all text groups and their content
  const textGroupRegex = /<g\s+id="(Text[^"]*|text[^"]*)">([\s\S]*?)<\/g>/gi;
  let groupMatch;
  
  while ((groupMatch = textGroupRegex.exec(svgContent)) !== null) {
    const groupId = groupMatch[1];
    const groupContent = groupMatch[2];
    
    // Extract individual text elements within the group
    const textRegex = /<text\s+class="([^"]*?)"\s+transform="([^"]*?)"[^>]*>([\s\S]*?)<\/text>/gi;
    let textMatch;
    
    while ((textMatch = textRegex.exec(groupContent)) !== null) {
      const className = textMatch[1];
      const transform = textMatch[2];
      const textContent = textMatch[3];
      
      // Extract plain text from tspans
      const plainText = textContent
        .replace(/<tspan[^>]*>/gi, '')
        .replace(/<\/tspan>/gi, '')
        .trim();
      
      if (plainText) {
        textElements.push({
          id: `${groupId}_${textElements.length}`,
          groupId,
          content: plainText,
          className,
          transform,
        });
      }
    }
  }
  
  // Deduplicate by content (some templates have multiple text elements with same content for effects)
  const uniqueTexts = new Map<string, TextElement>();
  textElements.forEach(el => {
    if (!uniqueTexts.has(el.content)) {
      uniqueTexts.set(el.content, el);
    }
  });
  
  return Array.from(uniqueTexts.values());
}

// Extract color classes from SVG style definitions
export function extractColorElements(svgContent: string): ColorElement[] {
  const colorElements: ColorElement[] = [];
  
  // Find style block
  const styleMatch = svgContent.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) return colorElements;
  
  const styleContent = styleMatch[1];
  
  // Extract fill colors
  const fillRegex = /\.(st\d+)\s*\{[^}]*fill:\s*(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3})/gi;
  let fillMatch;
  
  while ((fillMatch = fillRegex.exec(styleContent)) !== null) {
    const className = fillMatch[1];
    const color = fillMatch[2];
    
    // Skip common colors like white, black, grays unless they're significant
    if (!['#ffffff', '#fff', '#000000', '#000'].includes(color.toLowerCase())) {
      colorElements.push({
        className,
        property: 'fill',
        color,
        name: `Color ${colorElements.length + 1}`,
      });
    }
  }
  
  // Extract stroke colors
  const strokeRegex = /\.(st\d+)\s*\{[^}]*stroke:\s*(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3})/gi;
  let strokeMatch;
  
  while ((strokeMatch = strokeRegex.exec(styleContent)) !== null) {
    const className = strokeMatch[1];
    const color = strokeMatch[2];
    
    if (!['#ffffff', '#fff', '#000000', '#000'].includes(color.toLowerCase())) {
      colorElements.push({
        className,
        property: 'stroke',
        color,
        name: `Stroke ${colorElements.length + 1}`,
      });
    }
  }
  
  return colorElements;
}

// Check if SVG has specific layer types
export function detectLayers(svgContent: string): { hasLogo: boolean; hasPattern: boolean; hasLines: boolean } {
  return {
    hasLogo: /<g\s+id="Logo"/i.test(svgContent),
    hasPattern: /<g\s+id="Pattern"/i.test(svgContent) || /<g\s+id="Line_Pattern"/i.test(svgContent),
    hasLines: /<g\s+id="Lines"/i.test(svgContent),
  };
}

// Parse a complete SVG template
export function parseTemplate(svgContent: string, id: string, name: string, svgPath: string): TemplateConfig {
  const textElements = extractTextElements(svgContent);
  const colorElements = extractColorElements(svgContent);
  const layers = detectLayers(svgContent);
  
  return {
    id,
    name,
    svgPath,
    textElements,
    colorElements,
    ...layers,
  };
}

// Apply customizations to SVG content
export function applyCustomizations(
  svgContent: string,
  textChanges: Record<string, string>,
  colorChanges: Record<string, string>
): string {
  let modifiedSvg = svgContent;
  
  // Apply text changes
  Object.entries(textChanges).forEach(([originalText, newText]) => {
    if (originalText && newText && originalText !== newText) {
      // Replace text content in tspans
      const regex = new RegExp(`>\\s*${escapeRegex(originalText)}\\s*<`, 'gi');
      modifiedSvg = modifiedSvg.replace(regex, `>${newText}<`);
    }
  });
  
  // Apply color changes
  Object.entries(colorChanges).forEach(([originalColor, newColor]) => {
    if (originalColor && newColor && originalColor !== newColor) {
      const regex = new RegExp(escapeRegex(originalColor), 'gi');
      modifiedSvg = modifiedSvg.replace(regex, newColor);
    }
  });
  
  return modifiedSvg;
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replace logo in SVG (hides original logo group)
export function replaceLogo(svgContent: string, hideOriginal: boolean = true): string {
  if (!hideOriginal) return svgContent;
  
  // Add display:none to the Logo group
  return svgContent.replace(
    /<g\s+id="Logo">/gi,
    '<g id="Logo" style="display:none;">'
  );
}



