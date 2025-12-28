require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Templates found:', templates.length);
  templates.forEach(t => {
    console.log('\n---');
    console.log('ID:', t.id);
    console.log('Name:', t.name);
    console.log('Category:', t.category);
    console.log('filePath:', t.filePath);
    console.log('svgPath:', t.svgPath);
    console.log('svgIsPublic:', t.svgIsPublic);
    console.log('layerData length:', t.layerData ? t.layerData.length : 0);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
