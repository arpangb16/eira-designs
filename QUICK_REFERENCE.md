# Quick Reference Guide 🚀

Quick commands and reference information for Eira Designs development.

## 🏃 Quick Start

```bash
# Start development server
./run_Eira.sh

# Or manually
cd apparel_design_manager/nextjs_space
npm run dev
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `DOCUMENTATION.md` | Complete project documentation |
| `CHANGELOG.md` | Version history and changes |
| `QUICK_REFERENCE.md` | This file - quick reference |
| `run_Eira.sh` | Development server restart script |
| `.cursor/rules/party-mode.mdc` | Cursor IDE party mode rule |

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth.js
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (Optional - uses local storage if not set)
AWS_BUCKET_NAME="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_FOLDER_PREFIX="apparel-designs/"

# Force Local Storage (Optional)
USE_LOCAL_STORAGE=true  # Force local storage even if AWS configured
```

## 🗄️ Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Seed database
npx prisma db seed
```

## 🧭 Navigation Structure

### Left Sidebar
- **Admin**: Dashboard → Creator → Schools → Teams → Projects → Items → Cart → Orders → User Management
- **User**: Creator → Teams → Projects → Items → Cart → Orders

### Right Sidebar
- Logos → Templates → Fonts → Patterns → Colors → Embellishments

## 🔐 Authentication

**Current Status**: **DISABLED** for development
- Auto-sign-in enabled
- All users can access all features
- Mock admin user automatically created

**When Enabled**:
- Login: `/login`
- Signup: `/signup`
- Roles: ADMIN, USER
- Session: JWT-based with role stored in token

## 📡 Common API Endpoints

### Creator Designs
```
GET    /api/creator-designs
POST   /api/creator-designs
GET    /api/creator-designs/[id]
PATCH  /api/creator-designs/[id]
DELETE /api/creator-designs/[id]
```

### Templates
```
GET    /api/templates
POST   /api/templates
PATCH  /api/templates/[id]
DELETE /api/templates/[id]
POST   /api/templates/parse-svg
```

### File Upload
```
POST   /api/upload/presigned      # Get upload URL (S3 or local)
POST   /api/upload/local          # Upload to local storage
POST   /api/upload/file-url       # Get file URL
```

### Organization
```
GET    /api/schools
POST   /api/schools
GET    /api/teams
POST   /api/teams
GET    /api/projects
POST   /api/projects
GET    /api/items
POST   /api/items/[id]/variants/generate
```

### E-commerce
```
GET    /api/cart
POST   /api/cart
GET    /api/orders
POST   /api/orders
```

## 🎨 Creator Tool Workflow

1. **Upload Files**:
   - SVG boundaries (required)
   - PNG mask (optional)

2. **Add Templates**:
   - Click "Add Template" in Templates tab
   - Browse template library
   - Select template to add

3. **Position Templates**:
   - Click "Select" on template
   - Use sliders or drag in preview
   - Adjust X, Y, width, height

4. **Customize**:
   - Edit text content
   - Upload custom logos
   - Flip horizontally

5. **Save Design**:
   - Enter design name
   - Click "Save Design"

## 🎨 Template System

### Create Template
1. Go to Templates page (right sidebar)
2. Click "Add Template"
3. Enter name and category
4. Upload files (optional): `.ai`, `.jpeg`, `.png`, or `.svg`
5. Upload SVG for layer editing (optional)

### Edit Template Layers
1. Find template with SVG file
2. Click "Edit Layers" button
3. Edit text or colors
4. See live preview
5. Save changes

## 🛠️ Common Tasks

### Add New Menu Item
1. Update `components/left-sidebar.tsx` or `components/right-sidebar.tsx`
2. Add icon import from `lucide-react`
3. Add to navigation array

### Create New API Route
1. Create file in `app/api/[resource]/route.ts`
2. Export GET, POST, PATCH, DELETE handlers
3. Add authentication/authorization checks (currently disabled)

### Add New Component
1. Create file in `components/`
2. Use TypeScript
3. Follow existing component patterns
4. Use shadcn/ui components when possible

### Test File Upload
1. Check storage mode: `USE_LOCAL_STORAGE` or AWS config
2. Upload file through UI
3. Check `public/uploads/` for local storage
4. Check S3 bucket for AWS storage

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails | Authentication disabled - should auto-sign-in |
| File upload fails | Check `USE_LOCAL_STORAGE` or AWS credentials |
| Creator save fails | Run `npx prisma db push` to sync schema |
| Template layers not showing | Ensure template has SVG file and layerData |
| Sidebar not showing | Check user role (or auth disabled) |
| Build errors | Run `npx prisma generate`, clear `.next` |
| AWS connection fails | Check credentials, use local storage fallback |

## 💾 File Storage

### Local Storage
- **Location**: `public/uploads/`
- **URLs**: `http://localhost:3000/uploads/...`
- **Enable**: Set `USE_LOCAL_STORAGE=true` or don't set AWS vars

### AWS S3
- **Requires**: AWS credentials in `.env`
- **Features**: Presigned URLs, multipart uploads
- **Fallback**: Automatically uses local if AWS fails

## 📚 Documentation

- **Full Docs**: See `DOCUMENTATION.md`
- **Changes**: See `CHANGELOG.md`
- **Project README**: See `apparel_design_manager/README.md`

## 🎯 Development Workflow

1. Make changes
2. Test locally (`./run_Eira.sh`)
3. Check for TypeScript errors
4. Test file uploads (local or AWS)
5. Test creator design save
6. Commit changes
7. Push to GitHub

## 🎨 Template File Types

Supported file types for templates:
- `.ai` - Adobe Illustrator
- `.jpeg` / `.jpg` - JPEG images
- `.png` - PNG images
- `.svg` - SVG vector graphics

**All file types are optional** - templates can be created without files.

## 🔧 Creator Features

- **Template Library**: Browse and add templates
- **Positioning**: Drag-and-drop with sliders
- **Boundary Constraints**: Templates stay within SVG
- **Design Saving**: Save/load/edit/delete designs
- **SVG Detection**: Automatic layer and object detection

---

**Need more details?** Check `DOCUMENTATION.md` for comprehensive information!
