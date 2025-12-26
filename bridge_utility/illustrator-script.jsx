/**
 * Adobe Illustrator ExtendScript for Apparel Design Automation
 * 
 * This script manipulates layers in Illustrator documents based on design instructions.
 */

// Parameters (replaced by Node.js before execution)
var TEMPLATE_PATH = '{{TEMPLATE_PATH}}';
var OUTPUT_BASE_PATH = '{{OUTPUT_BASE_PATH}}';
var INSTRUCTIONS = JSON.parse('{{INSTRUCTIONS}}');

// Main execution
try {
  // Open the template document
  var doc = app.open(new File(TEMPLATE_PATH));
  
  // Process instructions
  processInstructions(doc, INSTRUCTIONS);
  
  // Export in various formats
  exportDocument(doc, OUTPUT_BASE_PATH);
  
  // Close without saving original
  doc.close(SaveOptions.DONOTSAVECHANGES);
  
  // Return success
  'SUCCESS';
  
} catch (error) {
  // Return error
  'ERROR: ' + error.toString();
}

/**
 * Process design instructions
 */
function processInstructions(doc, instructions) {
  // If instructions have placements array
  if (instructions.placements && instructions.placements.length > 0) {
    for (var i = 0; i < instructions.placements.length; i++) {
      var placement = instructions.placements[i];
      processPlacement(doc, placement);
    }
  }
  
  // If instructions have colors
  if (instructions.colors) {
    applyColors(doc, instructions.colors);
  }
  
  // If instructions have team data
  if (instructions.team) {
    applyTeamData(doc, instructions.team);
  }
}

/**
 * Process a single placement instruction
 */
function processPlacement(doc, placement) {
  var element = placement.element; // e.g., "logo", "text", "manufacturer_logo"
  var position = placement.position; // e.g., "top left", "center", "bottom right"
  var content = placement.content; // path to logo file or text content
  
  try {
    // Find or create layer
    var layerName = element.replace(/ /g, '_') + '_' + position.replace(/ /g, '_');
    var layer = findOrCreateLayer(doc, layerName);
    
    // Clear existing content in layer
    clearLayer(layer);
    
    if (element.toLowerCase().indexOf('logo') !== -1 && content) {
      // Place logo image
      placeLogo(doc, layer, content, position);
    } else if (element.toLowerCase().indexOf('text') !== -1 || element.toLowerCase().indexOf('name') !== -1) {
      // Add text
      addText(doc, layer, content || placement.text || element, position);
    }
  } catch (error) {
    // Log error but continue processing
  }
}

/**
 * Apply colors to the document
 */
function applyColors(doc, colors) {
  if (colors.primary) {
    applyColorToLayers(doc, ['primary_color', 'team_color'], colors.primary);
  }
  if (colors.secondary) {
    applyColorToLayers(doc, ['secondary_color', 'accent_color'], colors.secondary);
  }
}

/**
 * Apply team data to the document
 */
function applyTeamData(doc, teamData) {
  // Apply team name if there's a text layer for it
  if (teamData.name) {
    var teamNameLayer = findLayer(doc, 'team_name');
    if (teamNameLayer) {
      updateTextInLayer(teamNameLayer, teamData.name);
    }
  }
  
  // Apply colors if provided
  if (teamData.primaryColor) {
    applyColorToLayers(doc, ['primary_color', 'team_color'], teamData.primaryColor);
  }
  if (teamData.secondaryColor) {
    applyColorToLayers(doc, ['secondary_color', 'accent_color'], teamData.secondaryColor);
  }
}

/**
 * Find or create a layer
 */
function findOrCreateLayer(doc, layerName) {
  // Try to find existing layer
  for (var i = 0; i < doc.layers.length; i++) {
    if (doc.layers[i].name === layerName) {
      return doc.layers[i];
    }
  }
  
  // Create new layer
  var layer = doc.layers.add();
  layer.name = layerName;
  return layer;
}

/**
 * Find a layer by name
 */
function findLayer(doc, layerName) {
  for (var i = 0; i < doc.layers.length; i++) {
    if (doc.layers[i].name.toLowerCase() === layerName.toLowerCase()) {
      return doc.layers[i];
    }
  }
  return null;
}

/**
 * Clear all items in a layer
 */
function clearLayer(layer) {
  while (layer.pageItems.length > 0) {
    layer.pageItems[0].remove();
  }
}

/**
 * Place a logo in the document
 */
function placeLogo(doc, layer, logoPath, position) {
  try {
    // Place the logo file
    var placedItem = layer.placedItems.add();
    placedItem.file = new File(logoPath);
    
    // Position the logo
    positionItem(doc, placedItem, position);
    
    // Optionally resize logo to fit
    var maxSize = 200; // pixels
    if (placedItem.width > maxSize || placedItem.height > maxSize) {
      var scale = Math.min(maxSize / placedItem.width, maxSize / placedItem.height);
      placedItem.resize(scale * 100, scale * 100);
    }
  } catch (error) {
    // If placing fails, skip
  }
}

/**
 * Add text to the document
 */
function addText(doc, layer, textContent, position) {
  var textFrame = layer.textFrames.add();
  textFrame.contents = textContent;
  
  // Set text properties
  textFrame.textRange.characterAttributes.size = 24;
  textFrame.textRange.characterAttributes.fillColor = new RGBColor();
  
  // Position the text
  positionItem(doc, textFrame, position);
}

/**
 * Position an item based on position string
 */
function positionItem(doc, item, position) {
  var pos = position.toLowerCase();
  var docWidth = doc.width;
  var docHeight = doc.height;
  var margin = 50; // pixels from edge
  
  // Horizontal positioning
  if (pos.indexOf('left') !== -1) {
    item.left = margin;
  } else if (pos.indexOf('right') !== -1) {
    item.left = docWidth - item.width - margin;
  } else if (pos.indexOf('center') !== -1) {
    item.left = (docWidth - item.width) / 2;
  }
  
  // Vertical positioning
  if (pos.indexOf('top') !== -1) {
    item.top = docHeight - margin;
  } else if (pos.indexOf('bottom') !== -1) {
    item.top = item.height + margin;
  } else if (pos.indexOf('center') !== -1 || pos.indexOf('middle') !== -1) {
    item.top = (docHeight + item.height) / 2;
  }
}

/**
 * Apply color to specific layers
 */
function applyColorToLayers(doc, layerNames, hexColor) {
  var rgbColor = hexToRGB(hexColor);
  
  for (var i = 0; i < layerNames.length; i++) {
    var layer = findLayer(doc, layerNames[i]);
    if (layer) {
      applyColorToLayer(layer, rgbColor);
    }
  }
}

/**
 * Apply color to all items in a layer
 */
function applyColorToLayer(layer, rgbColor) {
  for (var i = 0; i < layer.pathItems.length; i++) {
    if (layer.pathItems[i].filled) {
      layer.pathItems[i].fillColor = rgbColor;
    }
  }
  
  for (var j = 0; j < layer.textFrames.length; j++) {
    layer.textFrames[j].textRange.characterAttributes.fillColor = rgbColor;
  }
}

/**
 * Update text in a layer
 */
function updateTextInLayer(layer, newText) {
  for (var i = 0; i < layer.textFrames.length; i++) {
    layer.textFrames[i].contents = newText;
  }
}

/**
 * Convert hex color to RGB
 */
function hexToRGB(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  
  var color = new RGBColor();
  color.red = r;
  color.green = g;
  color.blue = b;
  
  return color;
}

/**
 * Export document in multiple formats
 */
function exportDocument(doc, outputBasePath) {
  // Save as AI
  var aiFile = new File(outputBasePath + '.ai');
  doc.saveAs(aiFile);
  
  // Export as SVG
  try {
    var svgFile = new File(outputBasePath + '.svg');
    var svgOptions = new ExportOptionsSVG();
    svgOptions.embedRasterImages = true;
    doc.exportFile(svgFile, ExportType.SVG, svgOptions);
  } catch (error) {}
  
  // Export as PDF
  try {
    var pdfFile = new File(outputBasePath + '.pdf');
    var pdfOptions = new PDFSaveOptions();
    pdfOptions.compatibility = PDFCompatibility.ACROBAT5;
    pdfOptions.preserveEditability = false;
    doc.saveAs(pdfFile, pdfOptions);
  } catch (error) {}
  
  // Export as PNG
  try {
    var pngFile = new File(outputBasePath + '.png');
    var pngOptions = new ExportOptionsPNG24();
    pngOptions.horizontalScale = 300;
    pngOptions.verticalScale = 300;
    pngOptions.antiAliasing = true;
    pngOptions.transparency = true;
    doc.exportFile(pngFile, ExportType.PNG24, pngOptions);
  } catch (error) {}
}
