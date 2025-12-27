function parseElement(element, depth = 0) {
    const id = element.id || element.getAttribute('data-name') || `layer_${Math.random().toString(36).substr(2, 9)}`;
    const tagName = element.tagName.toLowerCase();
    // Determine layer type
    let type = 'unknown';
    if (tagName === 'g')
        type = 'group';
    else if (tagName === 'text')
        type = 'text';
    else if (tagName === 'image')
        type = 'image';
    else if (tagName === 'rect')
        type = 'rect';
    else if (tagName === 'circle')
        type = 'circle';
    else if (tagName === 'path')
        type = 'path';
    // If it's a group, check if it contains a text element to classify it as text layer
    if (type === 'group') {
        const textElement = element.querySelector('text');
        if (textElement) {
            type = 'text';
        }
    }
    // Extract attributes
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
    }
    // Extract content for text elements
    let content = '';
    if (type === 'text') {
        const textElement = tagName === 'text' ? element : element.querySelector('text');
        if (textElement) {
            content = textElement.textContent || '';
        }
    }
    // Extract common attributes
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const width = parseFloat(element.getAttribute('width') || '0');
    const height = parseFloat(element.getAttribute('height') || '0');
    const fill = element.getAttribute('fill') || undefined;
    const stroke = element.getAttribute('stroke') || undefined;
    const transform = element.getAttribute('transform') || undefined;
    // Parse children for groups
    const children = [];
    if (tagName === 'g' && depth < 10) { // Limit depth to prevent infinite recursion
        const childElements = Array.from(element.children);
        for (const child of childElements) {
            const parsedChild = parseElement(child, depth + 1);
            if (parsedChild && parsedChild.id !== id) { // Avoid duplicates
                children.push(parsedChild);
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
    };
}
export function parseSVG(svgContent) {
    let doc;
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
        // Browser environment
        const parser = new DOMParser();
        doc = parser.parseFromString(svgContent, 'image/svg+xml');
    }
    else {
        // Node.js environment - use global JSDOM if available
        if (typeof global !== 'undefined' && global.JSDOM) {
            const { JSDOM } = global;
            const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
            doc = dom.window.document;
        }
        else {
            throw new Error('DOMParser not available. In Node.js, JSDOM must be loaded globally.');
        }
    }
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
        throw new Error('Invalid SVG: No <svg> element found');
    }
    // Extract SVG dimensions
    const width = parseFloat(svgElement.getAttribute('width') || '0');
    const height = parseFloat(svgElement.getAttribute('height') || '0');
    const viewBox = svgElement.getAttribute('viewBox') || undefined;
    // Find all top-level groups with IDs (these are typically named layers)
    const topLevelGroups = Array.from(svgElement.children).filter(child => child.tagName.toLowerCase() === 'g' && (child.id || child.getAttribute('data-name')));
    const layers = [];
    for (const group of topLevelGroups) {
        const layer = parseElement(group);
        if (layer) {
            layers.push(layer);
        }
    }
    return {
        layers,
        width: width !== 0 ? width : undefined,
        height: height !== 0 ? height : undefined,
        viewBox
    };
}
