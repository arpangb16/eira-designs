import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const s3Client = new S3Client({});

async function uploadSvgToS3() {
  try {
    // Read the demo SVG file
    const svgPath = '/home/ubuntu/demo_tshirt.svg';
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    
    // Prepare S3 upload
    const bucketName = process.env.AWS_BUCKET_NAME;
    const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';
    const timestamp = Date.now();
    const cloud_storage_path = `${folderPrefix}public/uploads/${timestamp}-demo_tshirt.svg`;
    
    console.log('Uploading to S3:', cloud_storage_path);
    
    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: cloud_storage_path,
      Body: svgContent,
      ContentType: 'image/svg+xml'
    });
    
    await s3Client.send(uploadCommand);
    console.log('✅ SVG uploaded to S3 successfully!');
    
    // Parse SVG layers (simple extraction of g elements with id attributes)
    const layers = [];
    const gTagRegex = /<g\s+id="([^"]+)"[^>]*>/g;
    let match;
    
    while ((match = gTagRegex.exec(svgContent)) !== null) {
      const layerId = match[1];
      
      // Determine layer type based on content
      let layerType = 'group';
      if (/<text/.test(match.input.substring(match.index))) {
        layerType = 'text';
      } else if (/<rect/.test(match.input.substring(match.index))) {
        layerType = 'rect';
      } else if (/<circle/.test(match.input.substring(match.index))) {
        layerType = 'circle';
      }
      
      // Extract text content if it's a text layer
      let textContent = '';
      if (layerType === 'text') {
        const textMatch = match.input.substring(match.index).match(/<text[^>]*>([^<]+)<\/text>/);
        if (textMatch) {
          textContent = textMatch[1];
        }
      }
      
      layers.push({
        id: layerId,
        type: layerType,
        name: layerId,
        content: textContent
      });
    }
    
    const layerData = JSON.stringify({
      layers: layers,
      width: 800,
      height: 600
    });
    
    console.log('Parsed layers:', JSON.stringify(layers, null, 2));
    
    // Update the "snow camo" template
    const template = await prisma.template.findFirst({
      where: { name: 'snow camo' }
    });
    
    if (!template) {
      console.error('❌ Template "snow camo" not found!');
      return;
    }
    
    await prisma.template.update({
      where: { id: template.id },
      data: {
        svgPath: cloud_storage_path,
        svgIsPublic: true,
        layerData: layerData
      }
    });
    
    console.log('✅ Template updated successfully!');
    console.log('SVG Path:', cloud_storage_path);
    console.log('Layers found:', layers.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

uploadSvgToS3();
