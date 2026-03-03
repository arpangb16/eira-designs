// SVG Template Parser - Auto-detects editable elements from SVG templates
//
// IMPORTANT - TEMPLATE RULES (do not violate):
// - Never change the original look of templates. Editable text must be added or
//   detected without altering the source SVG's visual design (no replacing path-drawn
//   text with approximated curves, no hiding original art to show synthetic text).
// - When making text editable, keep the original form intact. If the design uses
//   curved/path text, only support editability when the source provides real
//   <text>/<textPath>; do not modify template SVGs to substitute a different look.

import type { SVGLayer } from './svg-parser-improved';

export interface TextElement {
  id: string;
  groupId: string;
  content: string;
  /** When text is split across multiple tspans (e.g. CAR + DI + NAL), segments for replace */
  segments?: string[];
  className: string;
  transform: string;
  /** Resolved font-size from class (e.g. "297.3px") for size editing */
  fontSize?: string;
  /** When set, this text is a fallback for a path-only group: replace that group's content with <text> when user edits */
  pathGroupId?: string;
  /** When true with pathGroupId "Text", replace the first path-only child <g> inside Text (built-in Classic) */
  pathGroupFirstChildOfText?: boolean;
  /** For circle/path text: id of the <path> this text follows (e.g. "path", "path1") for per-line rotation */
  pathId?: string;
}

export interface ColorElement {
  className: string;
  property: 'fill' | 'stroke';
  color: string;
  name: string;
}

/** Position of text on a circular path: 0%=top, 25%=right, 50%=bottom, 75%=left (with text-anchor middle) */
export type CircleTextRotation = 'top' | 'right' | 'bottom' | 'left';

export interface TemplateConfig {
  id: string;
  name: string;
  svgPath: string;
  textElements: TextElement[];
  colorElements: ColorElement[];
  hasLogo: boolean;
  hasPattern: boolean;
  hasLines: boolean;
  /** True when template has text on a path (e.g. Circle Badge); enables rotate-text control */
  hasCircleText: boolean;
  /** When set, Creator shows layer-based editor (from template layerData, e.g. template "31") */
  layers?: SVGLayer[];
}

// Find matching closing </g> for an opening <g> at startIndex (handles nested <g>)
function extractGroupContent(svgContent: string, openTagEndIndex: number): string {
  let depth = 1;
  let i = openTagEndIndex;
  const len = svgContent.length;
  while (i < len && depth > 0) {
    const nextOpen = svgContent.indexOf('<g', i);
    const nextClose = svgContent.indexOf('</g>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 2;
    } else {
      depth--;
      if (depth === 0) return svgContent.substring(openTagEndIndex, nextClose);
      i = nextClose + 4;
    }
  }
  return '';
}

// Build map of class name -> font-size value from SVG <style>
function getClassFontSizeMap(svgContent: string): Record<string, string> {
  const styleMatch = svgContent.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) return {};
  const styleContent = styleMatch[1];
  const classToFontSize: Record<string, string> = {};
  const ruleRegex = /([^{]+)\{([^{}]+)\}/g;
  let ruleMatch;
  while ((ruleMatch = ruleRegex.exec(styleContent)) !== null) {
    const decls = ruleMatch[2];
    const fsMatch = decls.match(/font-size:\s*([^;]+)/i);
    if (fsMatch) {
      const value = fsMatch[1].trim();
      const selectors = ruleMatch[1].trim();
      selectors.split(',').forEach((sel) => {
        const m = sel.trim().match(/\.(st\d+)/i);
        if (m) classToFontSize[m[1]] = value;
      });
    }
  }
  return classToFontSize;
}

// Normalize text for comparison (trim, collapse whitespace)
function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// Extract plain text from inner HTML (handles <textPath>, <tspan>, nested tags)
function getPlainTextFromInner(inner: string): string {
  const segmentRegex = /<tspan[^>]*>([\s\S]*?)<\/tspan>/gi;
  const segments: string[] = [];
  let segMatch;
  while ((segMatch = segmentRegex.exec(inner)) !== null) {
    const s = segMatch[1].trim();
    if (s) segments.push(s);
  }
  if (segments.length) return segments.join('');
  // Strip textPath (including xlink:href), tspan, then trim/collapse whitespace
  return inner
    .replace(/<textPath[^>]*>/gi, '')
    .replace(/<\/textPath>/gi, '')
    .replace(/<tspan[^>]*>/gi, '')
    .replace(/<\/tspan>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract text content from SVG text elements
export function extractTextElements(svgContent: string): TextElement[] {
  const textElements: TextElement[] = [];
  const classToFontSize = getClassFontSizeMap(svgContent);

  // Find all text groups: id starts with "Text"/"text" (e.g. Text, Text_2, text, text 2) or contains _Text/_text (e.g. Layer_Text_2)
  const textGroupOpenRegex = /<g\s+id="(Text[^"]*|text[^"]*|[^"]*_[Tt]ext[^"]*)">/gi;
  let groupMatch;

  while ((groupMatch = textGroupOpenRegex.exec(svgContent)) !== null) {
    const groupId = groupMatch[1];
    const openTagEnd = groupMatch.index + groupMatch[0].length;
    const groupContent = extractGroupContent(svgContent, openTagEnd);

    // 1) <text class="..." transform="..."> (standard; supports position)
    const textRegex = /<text\s+class="([^"]*?)"\s+transform="([^"]*?)"[^>]*>([\s\S]*?)<\/text>/gi;
    let textMatch;
    while ((textMatch = textRegex.exec(groupContent)) !== null) {
      const className = textMatch[1];
      const transform = textMatch[2];
      const textContent = textMatch[3];
      const segmentRegex = /<tspan[^>]*>([\s\S]*?)<\/tspan>/gi;
      const segments: string[] = [];
      let segMatch;
      while ((segMatch = segmentRegex.exec(textContent)) !== null) {
        const s = segMatch[1].trim();
        if (s) segments.push(s);
      }
      const plainText = segments.length ? segments.join('') : getPlainTextFromInner(textContent);
      if (plainText) {
        textElements.push({
          id: `${groupId}_${textElements.length}`,
          groupId,
          content: plainText,
          segments: segments.length > 1 ? segments : undefined,
          className,
          transform,
          fontSize: classToFontSize[className],
        });
      }
    }

    // 2) <text> with <textPath> / <tspan> only (e.g. 3.Circle Badge, 7.Pattern) – editable, no position
    const textAnyRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
    textAnyRegex.lastIndex = 0;
    while ((textMatch = textAnyRegex.exec(groupContent)) !== null) {
      const fullMatch = textMatch[0];
      if (/<text\s+class="[^"]*"\s+transform="/i.test(fullMatch)) continue; // already captured above
      const inner = textMatch[1];
      const plainText = getPlainTextFromInner(inner);
      if (plainText) {
        const classAttr = fullMatch.match(/class="([^"]*)"/);
        const className = classAttr ? classAttr[1].split(/\s+/)[0] : '';
        const pathIdMatch = inner.match(/<textPath[^>]*(?:xlink:)?href\s*=\s*["']#([^"']+)["']/i);
        const pathId = pathIdMatch ? pathIdMatch[1] : undefined;
        textElements.push({
          id: `${groupId}_${textElements.length}`,
          groupId,
          content: plainText,
          segments: undefined,
          className,
          transform: '',
          fontSize: className ? classToFontSize[className] : undefined,
          pathId,
        });
      }
    }
  }

  // 3) Any <text> elsewhere in SVG (e.g. textPath in Layer_1) so custom templates don't miss text
  const textAnyWhereRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = textAnyWhereRegex.exec(svgContent)) !== null) {
    const inner = match[1];
    const plainText = normalizeText(getPlainTextFromInner(inner));
    if (!plainText) continue;
    if (textElements.some((el) => el.content === plainText || normalizeText(el.content) === plainText)) continue;
    const fullMatch = match[0];
    const classAttr = fullMatch.match(/class="([^"]*)"/);
    const className = classAttr ? classAttr[1].split(/\s+/)[0] : '';
    textElements.push({
      id: `Text_${textElements.length}`,
      groupId: 'Text',
      content: plainText,
      segments: undefined,
      className,
      transform: '',
      fontSize: className ? classToFontSize[className] : undefined,
    });
  }

  // 4) Direct <textPath> content (in case <text> wrapper is malformed or has odd attributes)
  const textPathRegex = /<textPath[^>]*(?:xlink:)?href\s*=\s*["']#([^"']+)["'][^>]*>([\s\S]*?)<\/textPath>/gi;
  let tpMatch;
  while ((tpMatch = textPathRegex.exec(svgContent)) !== null) {
    const pathId = tpMatch[1];
    const plainText = normalizeText(getPlainTextFromInner(tpMatch[2]));
    if (!plainText) continue;
    if (textElements.some((el) => el.content === plainText || normalizeText(el.content) === plainText)) continue;
    textElements.push({
      id: `Text_${textElements.length}`,
      groupId: 'Text',
      content: plainText,
      segments: undefined,
      className: '',
      transform: '',
      fontSize: undefined,
      pathId,
    });
  }

  // Deduplicate by content: prefer element with transform (position) or segments (replace)
  const uniqueTexts = new Map<string, TextElement>();
  textElements.forEach((el) => {
    const existing = uniqueTexts.get(el.content);
    const keepNew =
      !existing ||
      (el.transform && !existing.transform) ||
      (el.segments && !existing.segments);
    if (keepNew) uniqueTexts.set(el.content, el);
  });

  let result = Array.from(uniqueTexts.values());

  // Fallback: if we only have one text and there's a path-only group for "Southwest", add a second editable slot
  if (result.length === 1) {
    const pathInfo = findPathOnlyTextGroup(svgContent);
    if (pathInfo) {
      const textClass = getFirstTextClassFromSvg(svgContent);
      result = [
        ...result,
        {
          id: `Text_2_0`,
          groupId: pathInfo.groupId,
          content: 'Southwest',
          segments: undefined,
          className: textClass,
          transform: '',
          fontSize: `${CREATOR_CURVE_FONT_SIZE_PX}px`,
          pathGroupId: pathInfo.groupId,
          pathGroupFirstChildOfText: pathInfo.firstPathOnlyChildOfText ?? false,
        },
      ];
    }
  }

  return result;
}

function findPathOnlyTextGroup(svgContent: string): { groupId: string; firstPathOnlyChildOfText?: boolean } | null {
  // 1) Separate group id="Text_2" or "text_2" (uploaded Classic with layers)
  const re2 = /<g\s+id="(Text_2|text_2)">/gi;
  const m2 = re2.exec(svgContent);
  if (m2) {
    const openEnd = m2.index + m2[0].length;
    const content = extractGroupContent(svgContent, openEnd);
    if (/<path\s/i.test(content) && !/<text\s/i.test(content)) return { groupId: m2[1] };
  }
  // 2) Built-in Classic: <g id="Text"> has first child <g> with only paths
  const reText = /<g\s+id="Text">/gi;
  const mText = reText.exec(svgContent);
  if (mText) {
    const openEnd = mText.index + mText[0].length;
    const content = extractGroupContent(svgContent, openEnd);
    const firstG = content.match(/\s*<g\s*>/);
    if (firstG) {
      const innerStart = openEnd + (firstG.index ?? 0) + firstG[0].length;
      const innerContent = extractGroupContent(svgContent, innerStart);
      if (/<path\s/i.test(innerContent) && !/<text\s/i.test(innerContent))
        return { groupId: 'Text', firstPathOnlyChildOfText: true };
    }
  }
  return null;
}

function getFirstTextClassFromSvg(svgContent: string): string {
  const m = svgContent.match(/<text[^>]*class="([^"]+)"/);
  return m ? m[1].split(/\s+/)[0] : '';
}

// Extract color classes from SVG style definitions (handles multi-selector rules like .st11, .st12 { fill: #x })
export function extractColorElements(svgContent: string): ColorElement[] {
  const colorElements: ColorElement[] = [];
  const skipColors = ['#ffffff', '#fff', '#000000', '#000'];

  const styleMatch = svgContent.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) return colorElements;

  const styleContent = styleMatch[1];
  const ruleRegex = /([^{]+)\{([^{}]+)\}/g;
  let ruleMatch;

  while ((ruleMatch = ruleRegex.exec(styleContent)) !== null) {
    const selectors = ruleMatch[1].trim();
    const block = ruleMatch[2];
    const fillMatch = block.match(/fill:\s*(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3})/i);
    const strokeMatch = block.match(/stroke:\s*(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3})/i);
    const classes = selectors.split(',').map((s) => s.trim().match(/\.(st\d+)/i)?.[1]).filter(Boolean) as string[];

    if (fillMatch && !skipColors.includes(fillMatch[1].toLowerCase())) {
      classes.forEach((className) => {
        colorElements.push({
          className,
          property: 'fill',
          color: fillMatch[1],
          name: `Color ${colorElements.length + 1}`,
        });
      });
    }
    if (strokeMatch && !skipColors.includes(strokeMatch[1].toLowerCase())) {
      classes.forEach((className) => {
        colorElements.push({
          className,
          property: 'stroke',
          color: strokeMatch[1],
          name: `Stroke ${colorElements.length + 1}`,
        });
      });
    }
  }

  return colorElements;
}

// Collect all class names (stXX) used inside a group. idPattern can be string (exact id) or RegExp.
function getClassesInGroups(svgContent: string, idPattern: string | RegExp): Set<string> {
  const out = new Set<string>();
  // Match any <g id="..."> and capture the id
  const groupRegex = /<g\s+id="([^"]+)">/gi;
  let groupMatch;
  while ((groupMatch = groupRegex.exec(svgContent)) !== null) {
    const groupId = groupMatch[1];
    const matches =
      typeof idPattern === 'string'
        ? groupId.toLowerCase() === idPattern.toLowerCase()
        : idPattern.test(groupId);
    if (!matches) continue;
    const openTagEnd = groupMatch.index + groupMatch[0].length;
    const content = extractGroupContent(svgContent, openTagEnd);
    const classRegex = /class="([^"]+)"/gi;
    let classMatch;
    while ((classMatch = classRegex.exec(content)) !== null) {
      classMatch[1].split(/\s+/).forEach((c) => {
        if (/^st\d+$/i.test(c.trim())) out.add(c.trim());
      });
    }
  }
  return out;
}

// Check if SVG has specific layer types
export function detectLayers(svgContent: string): {
  hasLogo: boolean;
  hasPattern: boolean;
  hasLines: boolean;
  hasCircleText: boolean;
} {
  return {
    hasLogo: /<g\s+id="Logo"/i.test(svgContent),
    hasPattern: /<g\s+id="Pattern"/i.test(svgContent) || /<g\s+id="Line_Pattern"/i.test(svgContent),
    hasLines: /<g\s+id="Lines"/i.test(svgContent),
    hasCircleText: /<textPath/i.test(svgContent),
  };
}

// Parse a complete SVG template
export function parseTemplate(svgContent: string, id: string, name: string, svgPath: string): TemplateConfig {
  const textElements = extractTextElements(svgContent);
  let colorElements = extractColorElements(svgContent);
  const layers = detectLayers(svgContent);

  // Only show colors used in Text or Lines (even if also used in Logo, e.g. 2. Classic)
  const textClasses = getClassesInGroups(svgContent, /^Text/i);
  const lineClasses = getClassesInGroups(svgContent, /^Lines?$/i);

  // Keep only colors used in Text or Lines (even if also in Logo, so e.g. 2. Classic Lines show)
  colorElements = colorElements.filter(
    (el) => textClasses.has(el.className) || lineClasses.has(el.className)
  );

  // Name by layer: "Text color N" or "Lines color N" (only Text/Lines are in the list now)
  let textN = 0;
  let lineN = 0;
  colorElements = colorElements.map((el) => {
    const inText = textClasses.has(el.className);
    const inLines = lineClasses.has(el.className);
    const name =
      inText && inLines ? `Lines color ${++lineN}` : inText ? `Text color ${++textN}` : `Lines color ${++lineN}`;
    return { ...el, name };
  });

  return {
    id,
    name,
    svgPath,
    textElements,
    colorElements,
    ...layers,
  };
}

// Arc path for top curved text. 102.svg defines creatorCurveTop in defs (exact arc from original). Fallback below used only if missing.
const CREATOR_CURVE_TOP_ID = 'creatorCurveTop';
// Fallback curve: quadratic from original path data (left 22,264 → peak 432,120 → right 790,262)
const CREATOR_CURVE_TOP_PATH = `M 22 264 Q 432 120 790 262`;

function ensureCurvePathInDefs(svgContent: string): string {
  if (svgContent.includes(`id="${CREATOR_CURVE_TOP_ID}"`)) return svgContent;
  return svgContent.replace(
    '</defs>',
    `<path id="${CREATOR_CURVE_TOP_ID}" d="${CREATOR_CURVE_TOP_PATH}" fill="none"/>\n  </defs>`
  );
}

// Text 2 (curved top): font and size to match original – Aachen BT Roman, ~2× WRESTLING size (81.4px → 162.8px)
const CREATOR_CURVE_FONT_FAMILY = "'Aachen BT Roman', Aachen, serif";
const CREATOR_CURVE_FONT_SIZE_PX = 162.8;

// Replace a path-only group with a <text> node; use curved <textPath> centered on arc
function replacePathGroupWithText(
  svgContent: string,
  groupId: string,
  newText: string,
  className: string,
  firstPathOnlyChildOfText?: boolean
): string {
  const escaped = newText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const classAttr = className ? ` class="${className}"` : '';
  const curveStyle = `font-family:${CREATOR_CURVE_FONT_FAMILY};font-size:${CREATOR_CURVE_FONT_SIZE_PX}px;font-weight:700;letter-spacing:.05em`;
  const curvedTextNode = `<text${classAttr} style="${curveStyle}" text-anchor="middle" transform="translate(0 0)"><textPath href="#${CREATOR_CURVE_TOP_ID}" startOffset="50%">${escaped}</textPath></text>`;

  let result = ensureCurvePathInDefs(svgContent);

  if (firstPathOnlyChildOfText && groupId === 'Text') {
    const re = /<g\s+id="Text">/gi;
    const m = re.exec(result);
    if (!m) return result;
    const openEnd = m.index + m[0].length;
    const content = extractGroupContent(result, openEnd);
    const firstG = content.match(/\s*<g\s*>/);
    if (!firstG || firstG.index === undefined) return result;
    const innerOpenStart = openEnd + firstG.index;
    const innerOpenEnd = innerOpenStart + firstG[0].length;
    const innerContent = extractGroupContent(result, innerOpenEnd);
    const innerCloseStart = innerOpenEnd + innerContent.length;
    const replaceStart = innerOpenStart;
    const replaceEnd = innerCloseStart + 4;
    return result.substring(0, replaceStart) + curvedTextNode + result.substring(replaceEnd);
  }

  const re = new RegExp(`<g\\s+id="${escapeRegex(groupId)}">`, 'gi');
  const m = re.exec(result);
  if (!m) return result;
  const openEnd = m.index + m[0].length;
  const content = extractGroupContent(result, openEnd);
  const closeStart = openEnd + content.length;
  return result.substring(0, openEnd) + curvedTextNode + result.substring(closeStart);
}

// Apply customizations to SVG content
export function applyCustomizations(
  svgContent: string,
  textChanges: Record<string, string>,
  colorChanges: Record<string, string>,
  textElements?: TextElement[]
): string {
  let modifiedSvg = svgContent;
  
  // Apply text changes
  Object.entries(textChanges).forEach(([originalText, newText]) => {
    if (originalText == null || newText == null || originalText === newText) return;
    const el = textElements?.find(e => e.content === originalText);
    if (el?.pathGroupId) {
      modifiedSvg = replacePathGroupWithText(
        modifiedSvg,
        el.pathGroupId,
        newText,
        el.className,
        el.pathGroupFirstChildOfText
      );
      return;
    }
    if (el?.segments && el.segments.length > 1) {
      // Text is split across multiple tspans (e.g. CAR + DI + NAL). Replace the whole run with newText.
      const pattern = el.segments
        .map((seg, i) => (i === 0 ? `>${escapeRegex(seg)}</tspan>` : `\\s*<tspan[^>]*>${escapeRegex(seg)}</tspan>`))
        .join('');
      const regex = new RegExp(pattern, 'gi');
      modifiedSvg = modifiedSvg.replace(regex, `>${newText}</tspan>`);
    } else {
      // Single tspan or no segments: replace whole content
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

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * For Circle Badge: set text content per path so top = Text 2 (e.g. BLACKHAWKS), bottom = Text 1 (e.g. Wrestling).
 * Replaces only the inner content of each <textPath href="#path"> and href="#path1"> so global replace doesn't overwrite.
 */
export function applyCircleTextSwap(
  svgContent: string,
  textElements: TextElement[],
  textChanges: Record<string, string>
): string {
  const elPath = textElements.find((e) => e.pathId === 'path');
  const elPath1 = textElements.find((e) => e.pathId === 'path1');
  if (!elPath || !elPath1) return svgContent;

  const topText = escapeXml(textChanges[elPath1.content] ?? elPath1.content);
  const bottomText = escapeXml(textChanges[elPath.content] ?? elPath.content);

  let result = svgContent;
  const pathRegex = /(<textPath[^>]*href="#path"[^>]*>)([\s\S]*?)(<\/textPath>)/i;
  const path1Regex = /(<textPath[^>]*href="#path1"[^>]*>)([\s\S]*?)(<\/textPath>)/i;

  // Replace the text content inside the innermost tspan (first >text</tspan> in nested structure)
  result = result.replace(pathRegex, (_, open, inner) => {
    const newInner = inner.replace(/>[^<]+<\/tspan>/, `>${topText}</tspan>`);
    return `${open}${newInner}</textPath>`;
  });
  result = result.replace(path1Regex, (_, open, inner) => {
    const newInner = inner.replace(/>[^<]+<\/tspan>/, `>${bottomText}</tspan>`);
    return `${open}${newInner}</textPath>`;
  });

  return result;
}

const CIRCLE_OFFSET: Record<CircleTextRotation, number> = {
  top: 0,
  right: 25,
  bottom: 50,
  left: 75,
};

/**
 * 103.svg: path (top circle) has 0% at ~3 o'clock so we add 75 so Top=12 o'clock.
 * path1 (bottom circle) runs opposite so we add 50 so Top/Bottom match.
 */
const CIRCLE_PATH_OFFSET_PCT: Record<string, number> = {
  path: 75,
  path1: 50,
};

function getStartOffsetForPath(pathId: string, position: CircleTextRotation): string {
  const base = CIRCLE_OFFSET[position];
  const add = CIRCLE_PATH_OFFSET_PCT[pathId] ?? 0;
  const pct = (base + add) % 100;
  return `${pct}%`;
}

/**
 * Apply circle text rotation per path: set startOffset on each <textPath> by path id
 * so the top circle can be "top" and the bottom circle "bottom" (original look).
 * circleTextRotations: pathId -> position (e.g. { path: 'top', path1: 'bottom' }).
 */
export function applyTextPathRotation(
  svgContent: string,
  circleTextRotations: Record<string, CircleTextRotation>
): string {
  let result = svgContent;

  // 1) Ensure <text> that contain <textPath> have text-anchor="middle"
  result = result.replace(
    /<text(\s+[^>]*)?>(\s*<textPath)/gi,
    (_, attrs, rest) => {
      const a = (attrs || '').trim();
      const hasAnchor = /text-anchor\s*=/i.test(a);
      const newAttrs = hasAnchor
        ? a.replace(/text-anchor\s*=\s*["'][^"']*["']/gi, 'text-anchor="middle"')
        : a ? `${a} text-anchor="middle"` : 'text-anchor="middle"';
      return `<text ${newAttrs}>${rest}`;
    }
  );

  // 2) Set startOffset per <textPath> using its href path id (path-direction correction for 103)
  result = result.replace(
    /<textPath(\s+[^>]*)>/gi,
    (_, attrs) => {
      const hrefMatch = attrs.match(/(?:xlink:)?href\s*=\s*["']#([^"']+)["']/i);
      const pathId = hrefMatch ? hrefMatch[1] : '';
      const position: CircleTextRotation = (circleTextRotations[pathId] ?? 'top');
      const offset = getStartOffsetForPath(pathId, position);
      const withoutOffset = attrs.replace(/\s*startOffset\s*=\s*["'][^"']*["']\s*/gi, ' ').trim();
      return withoutOffset
        ? `<textPath startOffset="${offset}" ${withoutOffset}>`
        : `<textPath startOffset="${offset}">`;
    }
  );

  return result;
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse translate(x y) or translate(x, y) from a transform string
function parseTranslate(transform: string): { x: number; y: number } | null {
  const m = transform.match(/translate\s*\(\s*([\d.-]+)\s*[, ]\s*([\d.-]+)\s*\)/i);
  if (!m) return null;
  const x = parseFloat(m[1]);
  const y = parseFloat(m[2]);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { x, y };
}

// Update translate part of transform string by adding dx, dy
function updateTransformTranslate(transform: string, dx: number, dy: number): string {
  const parsed = parseTranslate(transform);
  if (!parsed) return transform;
  const newX = parsed.x + dx;
  const newY = parsed.y + dy;
  return transform.replace(
    /translate\s*\(\s*[\d.-]+\s*[, ]\s*[\d.-]+\s*\)/i,
    `translate(${newX} ${newY})`
  );
}

// Resolve position key: use plainText, or original content if user edited text
function resolvePositionKey(
  plainText: string,
  textPositions: Record<string, { x: number; y: number }>,
  textElements?: TextElement[],
  textChanges?: Record<string, string>
): string | null {
  if (textPositions[plainText]) return plainText;
  if (!textElements || !textChanges) return null;
  const el = textElements.find(
    (e) => e.content === plainText || textChanges[e.content] === plainText
  );
  return el ? (textPositions[el.content] ? el.content : null) : null;
}

// Apply text position offsets to SVG (move text by dx, dy per content).
// Modifies <text> inside every <g id="Text..."> / <g id="text..."> so all templates work.
export function applyTextPositions(
  svgContent: string,
  textPositions: Record<string, { x: number; y: number }>,
  textElements?: TextElement[],
  textChanges?: Record<string, string>
): string {
  if (!textPositions || Object.keys(textPositions).length === 0) return svgContent;

  const textGroupRegex = /<g\s+id="(Text[^"]*|text[^"]*|[^"]*_[Tt]ext[^"]*)">/gi;
  const ranges: { openTagEnd: number; closeStart: number; content: string }[] = [];
  let groupMatch;
  while ((groupMatch = textGroupRegex.exec(svgContent)) !== null) {
    const openTagEnd = groupMatch.index + groupMatch[0].length;
    const content = extractGroupContent(svgContent, openTagEnd);
    const closeStart = openTagEnd + content.length;
    ranges.push({ openTagEnd, closeStart, content });
  }
  if (ranges.length === 0) return svgContent;

  const textRegex = /<text\s+([^>]*?)transform="([^"]+)"([^>]*)>([\s\S]*?)<\/text>/gi;
  function processGroupContent(groupContent: string): string {
    return groupContent.replace(
      textRegex,
      (match, before, transform, after, inner) => {
        const plainText = inner
          .replace(/<textPath[^>]*>/gi, '')
          .replace(/<\/textPath>/gi, '')
          .replace(/<tspan[^>]*>/gi, '')
          .replace(/<\/tspan>/gi, '')
          .trim();
        const key = resolvePositionKey(
          plainText,
          textPositions,
          textElements,
          textChanges
        );
        const pos = key ? textPositions[key] : null;
        if (!pos || (pos.x === 0 && pos.y === 0)) return match;
        const updated = updateTransformTranslate(transform, pos.x, pos.y);
        return `<text ${before}transform="${updated}"${after}>${inner}</text>`;
      }
    );
  }

  // Replace from end to start so indices stay valid
  let result = svgContent;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const { openTagEnd, closeStart, content } = ranges[i];
    const newContent = processGroupContent(content);
    result = result.substring(0, openTagEnd) + newContent + result.substring(closeStart);
  }
  return result;
}

// Resolve text content key for size lookup (original content when user edited text)
function resolveSizeKey(
  plainText: string,
  textElements?: TextElement[],
  textChanges?: Record<string, string>
): string | null {
  if (!textElements) return null;
  const el = textElements.find(
    (e) => e.content === plainText || textChanges?.[e.content] === plainText
  );
  return el ? el.content : null;
}

// Parse font-size string to number and unit (e.g. "297.3px" -> { num: 297.3, unit: "px" })
function parseFontSize(fontSize: string): { num: number; unit: string } | null {
  const m = fontSize.match(/^([\d.]+)\s*(px|pt|em|%)?$/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return null;
  return { num, unit: (m[2] || 'px').toLowerCase() };
}

// Apply text size scale to SVG (add/override font-size on <text> in Text groups).
export function applyTextSizes(
  svgContent: string,
  textSizes: Record<string, number>,
  textElements?: TextElement[],
  textChanges?: Record<string, string>
): string {
  if (!textSizes || Object.keys(textSizes).length === 0) return svgContent;

  const textGroupRegex = /<g\s+id="(Text[^"]*|text[^"]*|[^"]*_[Tt]ext[^"]*)">/gi;
  const ranges: { openTagEnd: number; closeStart: number; content: string }[] = [];
  let groupMatch;
  while ((groupMatch = textGroupRegex.exec(svgContent)) !== null) {
    const openTagEnd = groupMatch.index + groupMatch[0].length;
    const content = extractGroupContent(svgContent, openTagEnd);
    const closeStart = openTagEnd + content.length;
    ranges.push({ openTagEnd, closeStart, content });
  }
  if (ranges.length === 0) return svgContent;

  // Match any <text ...> (with or without transform) to add/merge font-size
  const textTagRegex = /<text\s+([^>]*)>([\s\S]*?)<\/text>/gi;
  function processGroupContent(groupContent: string): string {
    return groupContent.replace(
      textTagRegex,
      (match, attrs, inner) => {
        const plainText = inner
          .replace(/<textPath[^>]*>/gi, '')
          .replace(/<\/textPath>/gi, '')
          .replace(/<tspan[^>]*>/gi, '')
          .replace(/<\/tspan>/gi, '')
          .trim();
        const key = resolveSizeKey(plainText, textElements, textChanges);
        const scale = key && key in textSizes ? textSizes[key] : null;
        if (scale == null || scale === 1) return match;
        const el = textElements?.find((e) => e.content === key || textChanges?.[e.content] === plainText);
        const origFs = el?.fontSize;
        const parsed = origFs ? parseFontSize(origFs) : null;
        const baseNum = parsed?.num ?? 24;
        const unit = parsed?.unit ?? 'px';
        const newSize = Math.round(baseNum * scale * 10) / 10;
        const newSizeStr = `${newSize}${unit}`;
        // Add or merge style="font-size: X" (match style value so quoted font names like 'Aachen BT Roman' are preserved)
        const styleMatch = attrs.match(/style\s*=\s*(["'])([\s\S]*?)\1/i);
        let newStyle: string;
        if (styleMatch) {
          const existing = styleMatch[2]
            .replace(/font-size\s*:\s*[^;]+/gi, '')
            .replace(/;\s*;+/g, ';')
            .replace(/^\s*;|;\s*$/g, '')
            .trim();
          newStyle = existing ? `${existing}; font-size: ${newSizeStr}` : `font-size: ${newSizeStr}`;
        } else {
          newStyle = `font-size: ${newSizeStr}`;
        }
        const attrsWithoutStyle = attrs.replace(/style\s*=\s*(["'])[\s\S]*?\1/i, '').trim();
        const newAttrs = attrsWithoutStyle + (attrsWithoutStyle ? ' ' : '') + `style="${newStyle}"`;
        return `<text ${newAttrs}>${inner}</text>`;
      }
    );
  }

  let result = svgContent;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const { openTagEnd, closeStart, content } = ranges[i];
    const newContent = processGroupContent(content);
    result = result.substring(0, openTagEnd) + newContent + result.substring(closeStart);
  }
  return result;
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

// Hide background layers in SVG (for creator preview/export so design shows on shirt only)
export function hideSvgBackground(svgContent: string): string {
  return svgContent.replace(
    /<g(\s+[^>]*id="[^"]*[Bb]ackground[^"]*"[^>]*)>/g,
    (m) => {
      if (/style\s*=\s*["']/i.test(m)) {
        return m.replace(/style\s*=\s*["']([^"']*)["']/i, (_, val) =>
          `style="${val};display:none"`
        );
      }
      return m.replace(/\s*>$/, ' style="display:none">');
    }
  );
}
