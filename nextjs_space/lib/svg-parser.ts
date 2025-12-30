/**
 * SVG Parser Utility
 * Extracts layer information from SVG files
 */

export interface SVGLayer {
  id: string
  type: 'group' | 'text' | 'image' | 'rect' | 'circle' | 'path' | 'unknown'
  name: string
  children?: SVGLayer[]
  attributes?: Record<string, string>
  content?: string // For text elements
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  stroke?: string
  transform?: string
}

export interface ParsedSVG {
  width: number
  height: number
  viewBox?: string
  layers: SVGLayer[]
  raw: string // Original SVG content
}

/**
 * Parse SVG content and extract layer structure
 */
export function parseSVG(svgContent: string): ParsedSVG {
  // Parse SVG XML
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgContent, 'image/svg+xml')
  const svgElement = doc.documentElement

  // Extract SVG dimensions
  const width = parseFloat(svgElement.getAttribute('width') || '800')
  const height = parseFloat(svgElement.getAttribute('height') || '600')
  const viewBox = svgElement.getAttribute('viewBox') || undefined

  // Parse layers
  const layers = parseElement(svgElement)

  return {
    width,
    height,
    viewBox,
    layers,
    raw: svgContent
  }
}

/**
 * Recursively parse SVG elements
 */
function parseElement(element: Element, depth = 0): SVGLayer[] {
  const layers: SVGLayer[] = []

  // Skip SVG root element
  if (element.tagName === 'svg' && depth === 0) {
    Array.from(element.children).forEach(child => {
      layers.push(...parseElement(child, depth + 1))
    })
    return layers
  }

  const tagName = element.tagName.toLowerCase()
  const id = element.getAttribute('id') || element.getAttribute('data-name') || `${tagName}-${Date.now()}-${Math.random()}`
  
  // Determine layer type
  let type: SVGLayer['type'] = 'unknown'
  if (tagName === 'g') type = 'group'
  else if (tagName === 'text') type = 'text'
  else if (tagName === 'image') type = 'image'
  else if (tagName === 'rect') type = 'rect'
  else if (tagName === 'circle') type = 'circle'
  else if (tagName === 'path') type = 'path'

  // Extract attributes
  const attributes: Record<string, string> = {}
  Array.from(element.attributes).forEach(attr => {
    attributes[attr.name] = attr.value
  })

  // Extract common attributes
  const x = parseFloat(element.getAttribute('x') || '0')
  const y = parseFloat(element.getAttribute('y') || '0')
  const width = parseFloat(element.getAttribute('width') || '0')
  const height = parseFloat(element.getAttribute('height') || '0')
  const fill = element.getAttribute('fill') || undefined
  const stroke = element.getAttribute('stroke') || undefined
  const transform = element.getAttribute('transform') || undefined

  // Extract text content
  let content: string | undefined
  if (type === 'text') {
    content = element.textContent || ''
  }

  // Build layer object
  const layer: SVGLayer = {
    id,
    type,
    name: id,
    attributes,
    ...(content !== undefined && { content }),
    ...(x !== 0 && { x }),
    ...(y !== 0 && { y }),
    ...(width !== 0 && { width }),
    ...(height !== 0 && { height }),
    ...(fill && { fill }),
    ...(stroke && { stroke }),
    ...(transform && { transform })
  }

  // Recursively parse children for groups
  if (type === 'group' && element.children.length > 0) {
    layer.children = []
    Array.from(element.children).forEach(child => {
      layer.children!.push(...parseElement(child, depth + 1))
    })
  }

  layers.push(layer)
  return layers
}

/**
 * Find layer by ID in parsed SVG
 */
export function findLayerById(layers: SVGLayer[], id: string): SVGLayer | null {
  for (const layer of layers) {
    if (layer.id === id) return layer
    if (layer.children) {
      const found = findLayerById(layer.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Get all text layers from parsed SVG
 */
export function getTextLayers(layers: SVGLayer[]): SVGLayer[] {
  const textLayers: SVGLayer[] = []
  for (const layer of layers) {
    if (layer.type === 'text') {
      textLayers.push(layer)
    }
    if (layer.children) {
      textLayers.push(...getTextLayers(layer.children))
    }
  }
  return textLayers
}

/**
 * Get all image layers from parsed SVG
 */
export function getImageLayers(layers: SVGLayer[]): SVGLayer[] {
  const imageLayers: SVGLayer[] = []
  for (const layer of layers) {
    if (layer.type === 'image') {
      imageLayers.push(layer)
    }
    if (layer.children) {
      imageLayers.push(...getImageLayers(layer.children))
    }
  }
  return imageLayers
}

/**
 * Get all shape layers (rect, circle, path) from parsed SVG
 */
export function getShapeLayers(layers: SVGLayer[]): SVGLayer[] {
  const shapeLayers: SVGLayer[] = []
  for (const layer of layers) {
    if (['rect', 'circle', 'path'].includes(layer.type)) {
      shapeLayers.push(layer)
    }
    if (layer.children) {
      shapeLayers.push(...getShapeLayers(layer.children))
    }
  }
  return shapeLayers
}

/**
 * Flatten layer hierarchy into a simple list
 */
export function flattenLayers(layers: SVGLayer[]): SVGLayer[] {
  const flat: SVGLayer[] = []
  for (const layer of layers) {
    flat.push(layer)
    if (layer.children) {
      flat.push(...flattenLayers(layer.children))
    }
  }
  return flat
}
