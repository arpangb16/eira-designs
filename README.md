# Apparel Design Manager

An automated apparel design management system with Adobe Illustrator integration for generating production-ready design files.

## 🎯 Features

- **Dynamic Layer-Based Configuration**: Automatically detects and configures layers from SVG templates
- **Enhanced Creator Tool**: Interactive design creator with template library integration
- **Template Layer Editor**: Edit text and colors with live preview
- **Template Positioning**: Drag-and-drop positioning with boundary constraints
- **Design Variant Generation**: Create multiple design variations with different colors, text, logos, patterns, and embellishments
- **Adobe Illustrator Bridge**: Automated integration to generate final .AI files from variants
- **Design Asset Library**: Manage colors (Pantone), fonts, patterns, embellishments, logos, and templates
- **Organization Hierarchy**: Schools → Teams → Projects → Items
- **Cloud Storage**: AWS S3 integration with local storage fallback
- **Authentication**: Secure user authentication with NextAuth.js (currently disabled for development)

## 📁 Project Structure

```
apparel_design_manager/
├── nextjs_space/          # Next.js web application
│   ├── app/               # App router pages and API routes
│   ├── components/        # React components
│   ├── lib/               # Utility functions and configurations
│   ├── prisma/            # Database schema
│   └── public/            # Static assets
│       └── uploads/       # Local file uploads (gitignored)
├── bridge_utility/        # Adobe Illustrator bridge utility
│   ├── index.js           # Main bridge application
│   ├── illustrator-script.jsx  # Illustrator automation script
│   └── config.json        # Bridge configuration
└── Documentation files (.md)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL database
- AWS S3 bucket (optional - local storage available)
- Adobe Illustrator (for bridge utility - optional)

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
   
   # AWS S3 (Optional - uses local storage if not set)
   AWS_BUCKET_NAME="your-bucket-name"
   AWS_FOLDER_PREFIX="apparel-designs/"
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="us-east-1"
   
   # Force Local Storage (Optional)
   USE_LOCAL_STORAGE=true

   # Bypass auth and treat as admin (for local dev)
   BYPASS_AUTH=true
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

- Upload **Templates** (.ai, .jpeg, .png, .svg) - all optional
- Upload **Patterns** (e.g., camouflage, stripes)
- Upload **Embellishments** (e.g., graphics, badges)
- Manage **Fonts** (system or custom)
- Manage **Colors** (Pantone or custom)
- Upload **Logos** for teams, schools, or projects

### 3. Edit Template Layers

1. Navigate to Templates page (right sidebar)
2. Create template with SVG file
3. Click "Edit Layers" button
4. Edit text content or colors
5. See live preview of changes
6. Save changes

### 4. Create Designs in Creator

1. Navigate to Creator page
2. Upload SVG boundaries file
3. Add templates from library:
   - Click "Add Template" in Templates tab
   - Browse and select template
4. Position templates:
   - Use sliders or drag in preview
   - Adjust X, Y, width, height
5. Customize:
   - Edit text content
   - Upload custom logos
   - Flip templates
6. Save design:
   - Enter design name
   - Click "Save Design"

### 5. Create Design Variants

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

### 6. Generate Final Files

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
- **Authentication**: NextAuth.js (currently disabled for development)
- **File Storage**: AWS S3 (with local storage fallback)
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
  - File storage system
  - Template system
  - Creator tool guide
  - Development workflow
  - Troubleshooting guide

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference guide for common tasks and commands

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and recent changes

### Feature-Specific Documentation
- `BRIDGE_SETUP_GUIDE.md` - Detailed bridge utility setup instructions
- `VARIANT_TO_BRIDGE_WORKFLOW.md` - Complete variant generation workflow
- `SVG_WORKFLOW_TEST_SUMMARY.md` - SVG parsing and layer detection guide

## 🔒 Security Notes

- Never commit `.env` files (now in `.gitignore`)
- Keep AWS credentials secure
- Use environment variables for all sensitive data
- Database credentials should be stored securely
- `.env` file is excluded from git commits

## 🐛 Troubleshooting

### File Upload Issues

**Problem**: "Failed to generate upload url"

**Solutions**:
1. Check if `USE_LOCAL_STORAGE=true` is set
2. If using AWS, verify credentials are correct
3. System automatically falls back to local storage
4. Check `public/uploads/` directory exists

### Creator Design Save Issues

**Problem**: Design save fails

**Solutions**:
1. Run `npx prisma db push` to sync schema
2. Verify `CreatorDesign` model exists
3. Check database connection
4. Mock user is auto-created on first save

### Template Layer Editor Issues

**Problem**: Layers not showing or changes not saving

**Solutions**:
1. Ensure template has SVG file uploaded
2. Verify `layerData` exists in template
3. Check browser console for errors
4. Ensure template has valid SVG path

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

---

**Last Updated**: January 2025
**Version**: 2.0.0
