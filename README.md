# Apparel Design Manager

An automated apparel design management system with Adobe Illustrator integration for generating production-ready design files.

## 🎯 Features

- **Dynamic Layer-Based Configuration**: Automatically detects and configures layers from SVG templates
- **Design Variant Generation**: Create multiple design variations with different colors, text, logos, patterns, and embellishments
- **Adobe Illustrator Bridge**: Automated integration to generate final .AI files from variants
- **Design Asset Library**: Manage colors (Pantone), fonts, patterns, embellishments, and logos
- **Organization Hierarchy**: Schools → Teams → Projects → Items
- **Cloud Storage**: S3 integration for all file uploads and storage
- **Authentication**: Secure user authentication with NextAuth.js

## 📁 Project Structure

```
apparel_design_manager/
├── nextjs_space/          # Next.js web application
│   ├── app/               # App router pages and API routes
│   ├── components/        # React components
│   ├── lib/               # Utility functions and configurations
│   ├── prisma/            # Database schema
│   └── public/            # Static assets
├── bridge_utility/        # Adobe Illustrator bridge utility
│   ├── index.js           # Main bridge application
│   ├── illustrator-script.jsx  # Illustrator automation script
│   └── config.json        # Bridge configuration
└── Documentation files (.md, .pdf)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL database
- AWS S3 bucket (for file storage)
- Adobe Illustrator (for bridge utility)

### Web Application Setup

1. **Install dependencies:**
   ```bash
   cd nextjs_space
   yarn install
   ```

2. **Configure environment variables:**
   Create `.env` file in `nextjs_space/` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/apparel_db"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   AWS_BUCKET_NAME="your-bucket-name"
   AWS_FOLDER_PREFIX="apparel-designs/"
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="us-east-1"
   ```

3. **Set up database:**
   ```bash
   yarn prisma generate
   yarn prisma db push
   yarn prisma db seed
   ```

4. **Run development server:**
   ```bash
   yarn dev
   # Or use the convenience script from project root:
   ./run_Eira.sh
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Bridge Utility Setup

The bridge utility runs on your local machine and automates Adobe Illustrator to generate final .AI files.

1. **Install dependencies:**
   ```bash
   cd bridge_utility
   npm install
   ```

2. **Configure environment variables:**
   Create `.env` file in `bridge_utility/` directory:
   ```env
   WEB_APP_URL=https://your-deployed-app.com
   USER_EMAIL=your-email@example.com
   USER_PASSWORD=your-password
   
   # Optional
   TEMP_DIR=./temp
   OUTPUT_DIR=./output
   POLL_INTERVAL=5000
   
   # For Windows:
   ILLUSTRATOR_PATH=C:\Program Files\Adobe\Adobe Illustrator 2024\Support Files\Contents\Windows\Illustrator.exe
   
   # For Mac:
   ILLUSTRATOR_PATH=/Applications/Adobe Illustrator 2024/Adobe Illustrator.app/Contents/MacOS/Adobe Illustrator
   ```

3. **Run the bridge:**
   ```bash
   node index.js
   ```

## 📖 Usage Workflow

### 1. Set Up Your Organization

- Create Schools
- Add Teams to Schools
- Create Projects for Teams
- Add Items (design templates) to Projects

### 2. Configure Design Assets

- Upload **Patterns** (e.g., camouflage, stripes)
- Upload **Embellishments** (e.g., graphics, badges)
- Manage **Fonts** (system or custom)
- Manage **Colors** (Pantone or custom)
- Upload **Logos** for teams, schools, or projects

### 3. Create Design Variants

1. Navigate to an Item detail page
2. Go to the **Configuration** tab
3. Configure layers:
   - **Text layers**: Edit text content
   - **Graphic layers**: Select colors
   - **Logo layers**: Upload or select logos
   - **Patterns**: Add patterns with positions
   - **Embellishments**: Add graphics with size/position
4. Click **"Generate Variants"**
5. View generated SVG previews in the **Variants** tab

### 4. Generate Final Files

1. Select variants you want to produce
2. Click **"Generate Final Files"**
3. Ensure bridge utility is running on your local machine
4. Bridge automatically:
   - Downloads templates
   - Opens Adobe Illustrator
   - Applies configurations
   - Generates .AI files
   - Uploads back to the web app
5. Download final .AI files from the Variants tab

## 🔧 Technologies Used

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js
- **File Storage**: AWS S3 (via AWS SDK v3)
- **Adobe Integration**: Adobe Illustrator scripting (ExtendScript)
- **Automation**: Node.js, Axios, fs-extra

## 📚 Documentation

### Comprehensive Documentation
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete project documentation including:
  - Project overview and architecture
  - Authentication system details
  - Component documentation
  - API endpoint reference
  - Database schema
  - Navigation structure
  - Development workflow
  - Troubleshooting guide

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference guide for common tasks and commands

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and recent changes

### Feature-Specific Documentation
- `BRIDGE_SETUP_GUIDE.md` - Detailed bridge utility setup instructions
- `VARIANT_TO_BRIDGE_WORKFLOW.md` - Complete variant generation workflow
- `SVG_WORKFLOW_TEST_SUMMARY.md` - SVG parsing and layer detection guide

## 🔒 Security Notes

- Never commit `.env` files
- Keep AWS credentials secure
- Use environment variables for all sensitive data
- Database credentials should be stored securely

## 🐛 Troubleshooting

### Bridge Not Finding Jobs

1. Verify bridge is running: `node index.js`
2. Check `WEB_APP_URL` in bridge `.env`
3. Ensure variants are selected and "Generate Final Files" was clicked
4. Check bridge console for authentication errors

### Variants Stuck in "Generating"

1. Check if Adobe Illustrator path is correct in `.env`
2. Verify Illustrator is installed and licensed
3. Check bridge console for errors
4. Ensure template file is accessible

### Layer Configuration Not Working

1. Verify SVG file is uploaded for the template
2. Check SVG export settings from Illustrator:
   - Styling: Presentation Attributes
   - Object IDs: Layer Names
3. Ensure layer names match expected format

## 📝 License

This project is proprietary software.

## 👥 Contributors

Developed for Eira Designs apparel automation.

## 🆘 Support

For issues or questions, please contact the development team.
