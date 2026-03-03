export interface SVGLayer {
  id: string
  type: 'group' | 'text' | 'image' | 'rect' | 'circle' | 'path' | 'unknown'
  name: string
  children?: SVGLayer[]
  attributes?: Record<string, string>
  content?: string
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  stroke?: string
  transform?: string
}

export interface ParsedSVG {
  layers: SVGLayer[]
  width?: number
  height?: number
  viewBox?: string
}

function parseElement(element: Element, depth = 0): SVGLayer | null {
  const id = element.id || element.getAttribute('data-name') || `layer_${Math.random().toString(36).substr(2, 9)}`
  const tagName = element.tagName.toLowerCase()
  
  // Determine layer type
  let type: SVGLayer['type'] = 'unknown'
  if (tagName === 'g') type = 'group'
  else if (tagName === 'text') type = 'text'
  else if (tagName === 'image') type = 'image'
  else if (tagName === 'rect') type = 'rect'
  else if (tagName === 'circle') type = 'circle'
  else if (tagName === 'path') type = 'path'
  
  // If it's a group, check if it contains a text element to classify it as text layer
  if (type === 'group') {
    const textElement = element.querySelector('text')
    if (textElement) {
      type = 'text'
    }
  }
  
  // Extract attributes
  const attributes: Record<string, string> = {}
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    attributes[attr.name] = attr.value
  }
  
  // Extract content for text elements
  let content = ''
  if (type === 'text') {
    const textElement = tagName === 'text' ? element : element.querySelector('text')
    if (textElement) {
      content = textElement.textContent || ''
    }
  }
  
  // Extract common attributes
  const x = parseFloat(element.getAttribute('x') || '0')
  const y = parseFloat(element.getAttribute('y') || '0')
  const width = parseFloat(element.getAttribute('width') || '0')
  const height = parseFloat(element.getAttribute('height') || '0')
  const fill = element.getAttribute('fill') || undefined
  const stroke = element.getAttribute('stroke') || undefined
  const transform = element.getAttribute('transform') || undefined
  
  // Parse children for groups
  const children: SVGLayer[] = []
  if (tagName === 'g' && depth < 10) { // Limit depth to prevent infinite recursion
    const childElements = Array.from(element.children)
    for (const child of childElements) {
      const parsedChild = parseElement(child, depth + 1)
      if (parsedChild && parsedChild.id !== id) { // Avoid duplicates
        children.push(parsedChild)
      }
    }
  }
  
  return {
    id,
    type,
    name: id.replace(/_/g, ' '),
    children: children.length > 0 ? children : undefined,
    attributes,
    content: content || undefined,
    x: x !== 0 ? x : undefined,
    y: y !== 0 ? y : undefined,
    width: width !== 0 ? width : undefined,
    height: height !== 0 ? height : undefined,
    fill,
    stroke,
    transform
  }
}

export function parseSVG(svgContent: string): ParsedSVG {
  let doc: Document
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    // Browser environment
    const parser = new DOMParser()
    doc = parser.parseFromString(svgContent, 'image/svg+xml')
  } else {
    // Node.js environment - use global JSDOM if available
    if (typeof global !== 'undefined' && (global as any).JSDOM) {
      const { JSDOM } = (global as any)
      const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' })
      doc = dom.window.document
    } else {
      throw new Error('DOMParser not available. In Node.js, JSDOM must be loaded globally.')
    }
  }
  
  const svgElement = doc.querySelector('svg')
  if (!svgElement) {
    throw new Error('Invalid SVG: No <svg> element found')
  }
  
  // Extract SVG dimensions
  const width = parseFloat(svgElement.getAttribute('width') || '0')
  const height = parseFloat(svgElement.getAttribute('height') || '0')
  const viewBox = svgElement.getAttribute('viewBox') || undefined
  
  // Find top-level groups that represent layers.
  // 1) Prefer <g> with id or data-name (typical for named Illustrator layers).
  // 2) If none found, use any top-level <g> (fallback for AI exports without ids).
  // 3) If still none, and there is a single wrapper <g>, use its children as layers.
  const allTopLevelGroups = Array.from(svgElement.children).filter(
    child => child.tagName.toLowerCase() === 'g'
  ) as Element[]
  const namedGroups = allTopLevelGroups.filter(
    g => g.id || g.getAttribute('data-name')
  )
  let candidateGroups: Element[] = namedGroups.length > 0 ? namedGroups : allTopLevelGroups

  if (candidateGroups.length === 0 && allTopLevelGroups.length === 1) {
    const wrapper = allTopLevelGroups[0]
    candidateGroups = Array.from(wrapper.children).filter(
      child => child.tagName.toLowerCase() === 'g'
    ) as Element[]
  }

  let layers: SVGLayer[] = []
  for (let i = 0; i < candidateGroups.length; i++) {
    const group = candidateGroups[i]
    if (!group.id && !group.getAttribute('data-name')) {
      group.setAttribute('data-name', `Layer_${i + 1}`)
    }
    const layer = parseElement(group)
    if (layer) {
      layers.push(layer)
    }
  }

  // Last resort: if no layers found (e.g. flat SVG with no <g> structure), treat each
  // direct drawable child of <svg> as a layer so the user still gets something to edit.
  const drawableTags = new Set(['g', 'path', 'rect', 'circle', 'ellipse', 'text', 'image', 'polygon', 'polyline'])
  const skipTags = new Set(['defs', 'style', 'title', 'metadata', 'script'])
  if (layers.length === 0) {
    const directChildren = Array.from(svgElement.children).filter(
      child => {
        const tag = child.tagName.toLowerCase()
        return drawableTags.has(tag) && !skipTags.has(tag)
      }
    ) as Element[]
    directChildren.forEach((el, i) => {
      if (!el.id && !el.getAttribute('data-name')) {
        el.setAttribute('data-name', `Layer_${i + 1}`)
      }
      const layer = parseElement(el)
      if (layer) layers.push(layer)
    })
  }

  return {
    layers,
    width: width !== 0 ? width : undefined,
    height: height !== 0 ? height : undefined,
    viewBox
  }
}
