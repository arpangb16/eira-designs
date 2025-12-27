import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function check() {
  try {
    const templates = await prisma.template.findMany({
      select: { 
        id: true, 
        name: true, 
        category: true,
        filePath: true,
        svgPath: true, 
        layerData: true 
      }
    });
    console.log(JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
