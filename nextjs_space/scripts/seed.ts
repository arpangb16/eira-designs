import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Top 50 Pantone Colors
const pantoneColors = [
  { name: 'Pantone Red 032', hexCode: '#EF3340', pantoneCode: 'PANTONE Red 032 C', category: 'red' },
  { name: 'Pantone Orange 021', hexCode: '#FE5000', pantoneCode: 'PANTONE Orange 021 C', category: 'orange' },
  { name: 'Pantone Yellow', hexCode: '#FEEB00', pantoneCode: 'PANTONE Yellow C', category: 'yellow' },
  { name: 'Pantone Green', hexCode: '#00AB84', pantoneCode: 'PANTONE Green C', category: 'green' },
  { name: 'Pantone Blue 072', hexCode: '#10069F', pantoneCode: 'PANTONE Blue 072 C', category: 'blue' },
  { name: 'Pantone Purple', hexCode: '#BB29BB', pantoneCode: 'PANTONE Purple C', category: 'purple' },
  { name: 'Pantone Black', hexCode: '#2B2B2D', pantoneCode: 'PANTONE Black C', category: 'neutral' },
  { name: 'Pantone White', hexCode: '#FFFFFF', pantoneCode: 'PANTONE White', category: 'neutral' },
  { name: 'Pantone Cool Gray 11', hexCode: '#53565A', pantoneCode: 'PANTONE Cool Gray 11 C', category: 'gray' },
  { name: 'Pantone Warm Gray 11', hexCode: '#6E6259', pantoneCode: 'PANTONE Warm Gray 11 C', category: 'gray' },
  { name: 'Pantone 185', hexCode: '#E4002B', pantoneCode: 'PANTONE 185 C', category: 'red' },
  { name: 'Pantone 286', hexCode: '#0032A0', pantoneCode: 'PANTONE 286 C', category: 'blue' },
  { name: 'Pantone 348', hexCode: '#00AB39', pantoneCode: 'PANTONE 348 C', category: 'green' },
  { name: 'Pantone 021', hexCode: '#FF6900', pantoneCode: 'PANTONE 021 C', category: 'orange' },
  { name: 'Pantone 7473', hexCode: '#00B0B9', pantoneCode: 'PANTONE 7473 C', category: 'blue' },
  { name: 'Pantone 2736', hexCode: '#0047BB', pantoneCode: 'PANTONE 2736 C', category: 'blue' },
  { name: 'Pantone 368', hexCode: '#78D64B', pantoneCode: 'PANTONE 368 C', category: 'green' },
  { name: 'Pantone 109', hexCode: '#FFD700', pantoneCode: 'PANTONE 109 C', category: 'yellow' },
  { name: 'Pantone 151', hexCode: '#FF6A13', pantoneCode: 'PANTONE 151 C', category: 'orange' },
  { name: 'Pantone 200', hexCode: '#BA0C2F', pantoneCode: 'PANTONE 200 C', category: 'red' },
  { name: 'Pantone 2945', hexCode: '#00539B', pantoneCode: 'PANTONE 2945 C', category: 'blue' },
  { name: 'Pantone 347', hexCode: '#009A44', pantoneCode: 'PANTONE 347 C', category: 'green' },
  { name: 'Pantone 1235', hexCode: '#FFC72C', pantoneCode: 'PANTONE 1235 C', category: 'yellow' },
  { name: 'Pantone 2738', hexCode: '#0033A0', pantoneCode: 'PANTONE 2738 C', category: 'blue' },
  { name: 'Pantone 287', hexCode: '#002B5C', pantoneCode: 'PANTONE 287 C', category: 'blue' },
  { name: 'Pantone 7690', hexCode: '#00A3E0', pantoneCode: 'PANTONE 7690 C', category: 'blue' },
  { name: 'Pantone 485', hexCode: '#DA291C', pantoneCode: 'PANTONE 485 C', category: 'red' },
  { name: 'Pantone 123', hexCode: '#FFC72C', pantoneCode: 'PANTONE 123 C', category: 'yellow' },
  { name: 'Pantone 355', hexCode: '#009639', pantoneCode: 'PANTONE 355 C', category: 'green' },
  { name: 'Pantone 300', hexCode: '#005EB8', pantoneCode: 'PANTONE 300 C', category: 'blue' },
  { name: 'Pantone 130', hexCode: '#F07D00', pantoneCode: 'PANTONE 130 C', category: 'orange' },
  { name: 'Pantone 186', hexCode: '#C8102E', pantoneCode: 'PANTONE 186 C', category: 'red' },
  { name: 'Pantone 2766', hexCode: '#1E22AA', pantoneCode: 'PANTONE 2766 C', category: 'blue' },
  { name: 'Pantone 354', hexCode: '#00A64F', pantoneCode: 'PANTONE 354 C', category: 'green' },
  { name: 'Pantone 1788', hexCode: '#C5003E', pantoneCode: 'PANTONE 1788 C', category: 'red' },
  { name: 'Pantone 137', hexCode: '#F08521', pantoneCode: 'PANTONE 137 C', category: 'orange' },
  { name: 'Pantone 280', hexCode: '#012169', pantoneCode: 'PANTONE 280 C', category: 'blue' },
  { name: 'Pantone 2746', hexCode: '#0051BA', pantoneCode: 'PANTONE 2746 C', category: 'blue' },
  { name: 'Pantone 375', hexCode: '#97D700', pantoneCode: 'PANTONE 375 C', category: 'green' },
  { name: 'Pantone 179', hexCode: '#E03C31', pantoneCode: 'PANTONE 179 C', category: 'red' },
  { name: 'Pantone 2715', hexCode: '#003DA5', pantoneCode: 'PANTONE 2715 C', category: 'blue' },
  { name: 'Pantone 116', hexCode: '#FFCD00', pantoneCode: 'PANTONE 116 C', category: 'yellow' },
  { name: 'Pantone 144', hexCode: '#F26522', pantoneCode: 'PANTONE 144 C', category: 'orange' },
  { name: 'Pantone 193', hexCode: '#BF0D3E', pantoneCode: 'PANTONE 193 C', category: 'red' },
  { name: 'Pantone 2728', hexCode: '#0085CA', pantoneCode: 'PANTONE 2728 C', category: 'blue' },
  { name: 'Pantone 360', hexCode: '#6CC24A', pantoneCode: 'PANTONE 360 C', category: 'green' },
  { name: 'Pantone 1797', hexCode: '#D22630', pantoneCode: 'PANTONE 1797 C', category: 'red' },
  { name: 'Pantone 294', hexCode: '#002F6C', pantoneCode: 'PANTONE 294 C', category: 'blue' },
  { name: 'Pantone 7549', hexCode: '#F7941D', pantoneCode: 'PANTONE 7549 C', category: 'orange' },
  { name: 'Pantone 2748', hexCode: '#0057B8', pantoneCode: 'PANTONE 2748 C', category: 'blue' },
]

// Default Fonts
const defaultFonts = [
  { name: 'Arial', fontFamily: 'Arial, sans-serif', category: 'sans-serif', isSystemFont: true },
  { name: 'Helvetica', fontFamily: 'Helvetica, Arial, sans-serif', category: 'sans-serif', isSystemFont: true },
  { name: 'Times New Roman', fontFamily: '"Times New Roman", Times, serif', category: 'serif', isSystemFont: true },
  { name: 'Georgia', fontFamily: 'Georgia, serif', category: 'serif', isSystemFont: true },
  { name: 'Courier New', fontFamily: '"Courier New", Courier, monospace', category: 'serif', isSystemFont: true },
  { name: 'Verdana', fontFamily: 'Verdana, sans-serif', category: 'sans-serif', isSystemFont: true },
  { name: 'Tahoma', fontFamily: 'Tahoma, sans-serif', category: 'sans-serif', isSystemFont: true },
  { name: 'Impact', fontFamily: 'Impact, sans-serif', category: 'display', isSystemFont: true },
  { name: 'Comic Sans MS', fontFamily: '"Comic Sans MS", cursive', category: 'script', isSystemFont: true },
  { name: 'Trebuchet MS', fontFamily: '"Trebuchet MS", sans-serif', category: 'sans-serif', isSystemFont: true },
]

async function main() {
  console.log('Starting seed...')

  // Create default test user
  const hashedPassword = await bcrypt.hash('johndoe123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
    },
  })

  console.log('✓ Test user created:', user?.email)

  // Seed Pantone Colors
  console.log('\nSeeding Pantone colors...')
  let colorCount = 0
  for (const color of pantoneColors) {
    await prisma.color.upsert({
      where: { hexCode: color.hexCode },
      update: {},
      create: color,
    })
    colorCount++
  }
  console.log(`✓ Seeded ${colorCount} Pantone colors`)

  // Seed Default Fonts
  console.log('\nSeeding default fonts...')
  let fontCount = 0
  for (const font of defaultFonts) {
    const existingFont = await prisma.font.findFirst({
      where: { fontFamily: font.fontFamily }
    })
    if (!existingFont) {
      await prisma.font.create({ data: font })
      fontCount++
    }
  }
  console.log(`✓ Seeded ${fontCount} new fonts (${defaultFonts.length - fontCount} already existed)`)

  console.log('\n✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error in seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
