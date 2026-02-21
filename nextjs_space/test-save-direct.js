// Direct test of the save functionality
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function testSave() {
  console.log('🧪 Testing Creator Design Save Directly...\n');
  
  try {
    // Step 1: Get or create mock user
    console.log('Step 1: Getting or creating mock user...');
    let mockUser = await prisma.user.findFirst({
      where: { email: 'admin@eira.com' },
    });
    
    if (!mockUser) {
      console.log('  Creating new user...');
      mockUser = await prisma.user.create({
        data: {
          email: 'admin@eira.com',
          name: 'Admin User',
        },
      });
      console.log('  ✅ User created:', mockUser.id);
    } else {
      console.log('  ✅ User found:', mockUser.id);
    }
    
    // Step 2: Try to save a design
    console.log('\nStep 2: Saving test design...');
    const testDesignData = {
      pngMaskPath: null,
      svgBoundaryPath: null,
      templates: [],
      shirtColor: '#FFFFFF',
      svgObjects: [],
      detectedApparel: 'tshirt',
    };
    
    const design = await prisma.creatorDesign.create({
      data: {
        name: 'Test Design ' + Date.now(),
        userId: mockUser.id,
        schoolId: null,
        teamId: null,
        projectId: null,
        itemId: null,
        designData: JSON.stringify(testDesignData),
        previewImage: null,
        apparelType: 'tshirt',
      },
    });
    
    console.log('  ✅ Design saved successfully!');
    console.log('  Design ID:', design.id);
    console.log('  Design Name:', design.name);
    
    // Step 3: Verify we can read it back
    console.log('\nStep 3: Verifying design can be read...');
    const savedDesign = await prisma.creatorDesign.findUnique({
      where: { id: design.id },
    });
    
    if (savedDesign) {
      console.log('  ✅ Design retrieved successfully!');
      console.log('  Name:', savedDesign.name);
      console.log('  User ID:', savedDesign.userId);
    } else {
      console.log('  ❌ Design not found after saving!');
    }
    
    // Cleanup
    console.log('\nStep 4: Cleaning up test design...');
    await prisma.creatorDesign.delete({
      where: { id: design.id },
    });
    console.log('  ✅ Test design deleted');
    
    console.log('\n✅ All tests passed! Save functionality is working.');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    
    if (error.code === 'P2002') {
      console.error('\n💡 This is a unique constraint violation');
    } else if (error.code === 'P2003') {
      console.error('\n💡 This is a foreign key constraint violation');
      console.error('   The referenced record does not exist');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSave();



