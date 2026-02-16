# Eira Designs - Complete Documentation 🎉

## Table of Contents

1. [Project Overview](#project-overview)
2. [Recent Changes](#recent-changes)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Authentication System](#authentication-system)
6. [Component Documentation](#component-documentation)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Navigation & Sidebars](#navigation--sidebars)
10. [File Storage System](#file-storage-system)
11. [Template System](#template-system)
12. [Creator Tool](#creator-tool)
13. [Development Workflow](#development-workflow)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Eira Designs** is a comprehensive apparel design management system that enables teams to create, manage, and generate production-ready design files. The system integrates with Adobe Illustrator through a bridge utility to automate the creation of final design files.

### Key Features

- 🎨 **Dynamic Design Management**: Layer-based configuration system for SVG templates
- 👥 **Organization Hierarchy**: Schools → Teams → Projects → Items
- 🎨 **Design Asset Library**: Colors, Fonts, Patterns, Embellishments, Logos, Templates
- 🛒 **Shopping Cart & Orders**: E-commerce functionality for design purchases
- 🔐 **Role-Based Access Control**: Admin and User roles with different permissions
- ☁️ **Cloud Storage**: AWS S3 integration with local storage fallback
- 🎨 **Enhanced Creator Tool**: Interactive design creator with template library integration
- 🎨 **Template Layer Editor**: Edit text and colors with live preview
- 📐 **Template Positioning**: Drag-and-drop positioning with boundary constraints
- 🔗 **Adobe Bridge Integration**: Automated .AI file generation

---

## Recent Changes

### Latest Updates (Current Session)

#### Template System Enhancements
- ✅ **Template Layer Editor**: Full-featured editor for editing template layers
  - Edit text content for text layers
  - Change fill and stroke colors for graphic layers
  - Live preview of changes in real-time
  - Save modified layer data back to templates
- ✅ **Template Selector in Creator**: Browse and add templates from library
  - Search templates by name, category, or description
  - Visual preview of templates with SVG previews
  - One-click template addition to creator designs
- ✅ **Enhanced Template Creation**: Support for multiple file types
  - Accepts `.ai`, `.jpeg`, `.jpg`, `.png`, and `.svg` files
  - All file types are optional (no longer required)
  - Better file type validation and error handling

#### Creator Tool Improvements
- ✅ **Template Positioning Controls**: Full positioning system
  - Position X/Y sliders (0-100%)
  - Width/Height sliders (5-50%)
  - Drag-and-drop positioning in preview
  - Boundary constraints to keep templates within SVG boundaries
  - Horizontal flip functionality
- ✅ **Creator Design Save**: Complete CRUD operations
  - Save designs with all template configurations
  - Load saved designs for editing
  - Update existing designs
  - Delete designs
  - Preview images support

#### File Storage System
- ✅ **Local Storage Fallback**: Automatic fallback when AWS not configured
  - Files saved to `public/uploads/` directory
  - Automatic directory creation
  - Seamless switching between AWS and local storage
  - Environment variable: `USE_LOCAL_STORAGE=true` to force local storage
- ✅ **AWS Connection**: Verified and working
  - Presigned URL generation tested
  - Automatic credential validation
  - Better error messages and logging

#### Authentication Updates
- ✅ **Authentication Disabled**: For development purposes
  - All users can access all features
  - Mock admin user automatically created
  - No login required (auto-sign-in)
  - Easy to re-enable when needed

#### Database Schema Updates
- ✅ **CreatorDesign Model**: New model for saving creator designs
  - Stores design configurations
  - Links to organization hierarchy (school, team, project, item)
  - JSON storage for flexible design data
  - Preview image support
- ✅ **Template Model Updates**: File path now optional
  - Templates can be created without files
  - Better support for template library workflow

### Navigation Updates

#### Left Sidebar
- **Removed**: Templates, Logos, Patterns, Embellishments, Colors, Fonts
- **Current Menu Items**:
  - **Admin Users**: Dashboard, Creator, Schools, Teams, Projects, Items, Cart, Orders, User Management
  - **Regular Users**: Creator, Teams, Projects, Items, Cart, Orders

#### Right Sidebar
- **Added**: Logos (now first item)
- **Current Menu Items**: Logos, Templates, Fonts, Patterns, Colors, Embellishments

---

## Project Structure

```
Eira-designs/
├── apparel_design_manager/
│   ├── nextjs_space/              # Main Next.js application
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── api/              # API routes
│   │   │   │   ├── auth/         # NextAuth.js routes
│   │   │   │   ├── schools/      # School management
│   │   │   │   ├── teams/        # Team management
│   │   │   │   ├── projects/     # Project management
│   │   │   │   ├── items/        # Item/Design management
│   │   │   │   ├── templates/    # Template management
│   │   │   │   │   ├── parse-svg/ # SVG parsing endpoint
│   │   │   │   ├── logos/        # Logo management
│   │   │   │   ├── patterns/     # Pattern management
│   │   │   │   ├── fonts/        # Font management
│   │   │   │   ├── colors/       # Color management
│   │   │   │   ├── embellishments/ # Embellishment management
│   │   │   │   ├── cart/         # Shopping cart
│   │   │   │   ├── orders/       # Order management
│   │   │   │   ├── creator-designs/ # Creator design CRUD
│   │   │   │   ├── bridge/       # Adobe Bridge integration
│   │   │   │   └── upload/       # File upload endpoints
│   │   │   │       ├── presigned/ # S3 presigned URLs
│   │   │   │       ├── multipart/ # Multipart uploads
│   │   │   │       └── local/     # Local file storage
│   │   │   ├── admin/            # Admin pages
│   │   │   ├── dashboard/        # Dashboard page
│   │   │   ├── creator/          # Design creator page
│   │   │   │   └── _components/
│   │   │   │       ├── enhanced-creator-client.tsx
│   │   │   │       └── template-selector.tsx
│   │   │   ├── templates/         # Template management page
│   │   │   │   └── _components/
│   │   │   │       ├── templates-client.tsx
│   │   │   │       └── template-layer-editor.tsx
│   │   │   ├── login/            # Login page
│   │   │   ├── signup/           # Signup page
│   │   │   └── [various pages]    # Other feature pages
│   │   ├── components/            # React components
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── left-sidebar.tsx  # Left navigation sidebar
│   │   │   ├── right-sidebar.tsx # Right design library sidebar
│   │   │   ├── app-header.tsx    # Application header
│   │   │   ├── app-layout.tsx    # Main layout wrapper
│   │   │   ├── svg-editor.tsx    # SVG editing component
│   │   │   ├── file-upload.tsx   # File upload component
│   │   │   └── [other components]
│   │   ├── lib/                   # Utility libraries
│   │   │   ├── auth-options.ts   # NextAuth configuration
│   │   │   ├── db.ts             # Prisma client
│   │   │   ├── s3.ts             # AWS S3 utilities
│   │   │   ├── local-storage.ts  # Local file storage utilities
│   │   │   ├── svg-template-parser.ts # SVG parsing
│   │   │   ├── admin-check.ts    # Admin authorization
│   │   │   └── [other utilities]
│   │   ├── prisma/               # Database
│   │   │   └── schema.prisma     # Prisma schema
│   │   ├── types/                # TypeScript type definitions
│   │   │   └── next-auth.d.ts    # NextAuth type extensions
│   │   └── public/               # Static assets
│   │       └── uploads/          # Local file uploads (gitignored)
│   ├── bridge_utility/           # Adobe Illustrator bridge
│   └── README.md                 # Project README
├── .cursor/                      # Cursor IDE configuration
│   └── rules/                    # Cursor rules
│       └── party-mode.mdc        # Party mode rule
├── run_Eira.sh                   # Development server restart script
├── DOCUMENTATION.md              # This file
├── CHANGELOG.md                  # Version history
└── QUICK_REFERENCE.md            # Quick reference guide
```

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** database
- **AWS S3** bucket (optional - local storage available)
- **Adobe Illustrator** (for bridge utility - optional)

### Environment Variables

Create a `.env` file in `apparel_design_manager/nextjs_space/`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/apparel_db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (Optional - will use local storage if not set)
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="apparel-designs/"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"

# Force Local Storage (Optional)
USE_LOCAL_STORAGE=true  # Set to true to force local storage even if AWS is configured
```

### Installation Steps

1. **Install dependencies:**
   ```bash
   cd apparel_design_manager/nextjs_space
   npm install
   # or
   yarn install
   ```

2. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed  # Optional: seed initial data
   ```

3. **Run development server:**
   ```bash
   npm run dev
   # or use the convenience script
   ./run_Eira.sh
   ```

4. **Access the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Auto-sign-in enabled (no login required in development)

### Quick Start Script

Use the provided script to restart the development server:

```bash
./run_Eira.sh
```

This script:
- Stops any running Next.js processes
- Navigates to the project directory
- Installs dependencies if needed
- Starts the development server

---

## Authentication System

### Overview

**Note**: Authentication is currently **DISABLED** for development. All users can access all features without login.

The application uses **NextAuth.js** with JWT strategy for authentication. When enabled, user roles are stored in the JWT token to avoid database queries on every session access.

### Authentication Flow (When Enabled)

1. **Login**: User submits email/password
2. **Authorize**: `auth-options.ts` validates credentials against database
3. **JWT Creation**: User ID and role stored in JWT token
4. **Session**: Role retrieved from token (no DB query needed)

### User Roles

- **ADMIN**: Full access to all features including user management
- **USER**: Standard access to design creation and management

### Files

- **`lib/auth-options.ts`**: NextAuth configuration
  - Currently returns mock admin user (authentication disabled)
  - Can be re-enabled by uncommenting authentication code
- **`app/api/auth/[...nextauth]/route.ts`**: NextAuth API route handler
- **`types/next-auth.d.ts`**: TypeScript definitions for NextAuth
- **`lib/admin-check.ts`**: Admin authorization helpers (currently bypassed)

### Re-enabling Authentication

To re-enable authentication:
1. Uncomment authentication code in `lib/auth-options.ts`
2. Uncomment authentication checks in `lib/admin-check.ts`
3. Remove auto-sign-in from `app/login/page.tsx`
4. Update API routes to check authentication

---

## Component Documentation

### Layout Components

#### `app-layout.tsx`
Main layout wrapper that provides:
- Session provider
- Theme provider
- Left and right sidebars
- Main content area

#### `left-sidebar.tsx`
Left navigation sidebar with:
- Collapsible design
- Role-based menu items
- Active route highlighting
- Mobile responsive (Sheet component)

**Menu Structure**:
- **Admin**: Dashboard, Creator, Schools, Teams, Projects, Items, Cart, Orders, User Management
- **User**: Creator, Teams, Projects, Items, Cart, Orders

#### `right-sidebar.tsx`
Right sidebar for design library:
- Logos, Templates, Fonts, Patterns, Colors, Embellishments
- Collapsible design
- Quick access to design assets

#### `app-header.tsx`
Application header with:
- User information
- Sign out functionality
- Responsive design

### Creator Components

#### `enhanced-creator-client.tsx`
Enhanced design creator with:
- **File Uploads**: PNG mask and SVG boundaries
- **Template Management**: Add templates from library
- **Template Positioning**: Drag-and-drop with sliders
- **Design Saving**: Save/load/edit/delete designs
- **SVG Object Detection**: Automatic layer detection
- **Boundary Constraints**: Templates stay within SVG boundaries

**Key Features**:
- Gallery view for saved designs
- Editor view with live preview
- Template selector dialog
- Position controls (X, Y, width, height)
- Flip horizontal functionality
- Color picker for shirt colors

#### `template-selector.tsx`
Template browser component:
- Browse templates from database
- Search functionality
- SVG preview display
- One-click template addition

### Template Components

#### `templates-client.tsx`
Template management interface:
- Create/edit/delete templates
- Upload template files (.ai, .jpeg, .png, .svg)
- SVG layer parsing
- Template preview

#### `template-layer-editor.tsx`
Layer editing interface:
- Edit text content for text layers
- Change colors (fill/stroke) for graphic layers
- Live preview of changes
- Save modified layer data

**Features**:
- Two-tab interface (Text / Colors)
- Real-time SVG modification
- Color picker with hex input
- Layer count display

### File Upload Component

#### `file-upload.tsx`
Universal file upload component:
- Supports both AWS S3 and local storage
- Automatic fallback to local storage
- Progress indicators
- File size validation
- Multipart upload for large files

### UI Components

All UI components are from **shadcn/ui**:
- Button, Input, Card, Dialog, Sheet, Tabs, Slider, etc.
- Located in `components/ui/`
- Fully customizable with Tailwind CSS

---

## API Documentation

### Authentication Endpoints

#### `POST /api/auth/[...nextauth]`
NextAuth.js handler for authentication.
**Note**: Currently disabled for development.

### Creator Design Endpoints

#### `GET /api/creator-designs`
Get all saved designs for current user
- Returns: Array of saved designs

#### `POST /api/creator-designs`
Save a new design
- Body: `{ name, designData, previewImage, apparelType, schoolId?, teamId?, projectId?, itemId? }`
- Returns: Created design object

#### `GET /api/creator-designs/[id]`
Get a specific design
- Returns: Design object

#### `PATCH /api/creator-designs/[id]`
Update a design
- Body: `{ name?, designData?, previewImage?, apparelType? }`
- Returns: Updated design object

#### `DELETE /api/creator-designs/[id]`
Delete a design
- Returns: Success message

### Template Endpoints

#### `GET /api/templates`
List all templates
- Returns: Array of templates with layer counts

#### `POST /api/templates`
Create a new template
- Body: `{ name, category, filePath?, fileIsPublic?, svgPath?, svgIsPublic?, layerData?, description? }`
- **Note**: `filePath` is now optional
- Returns: Created template

#### `PATCH /api/templates/[id]`
Update a template
- Body: `{ name?, category?, filePath?, layerData?, ... }`
- Returns: Updated template

#### `POST /api/templates/parse-svg`
Parse SVG file to extract layers
- Body: `{ svgContent }`
- Returns: `{ parsed: { layers: [...] } }`

### File Upload Endpoints

#### `POST /api/upload/presigned`
Get presigned URL for S3 upload (or local storage endpoint)
- Body: `{ fileName, contentType, isPublic }`
- Returns: `{ uploadUrl, cloud_storage_path }`
- **Auto-fallback**: Uses local storage if AWS not configured

#### `POST /api/upload/local`
Upload file to local storage
- FormData: `{ file, isPublic }`
- Returns: `{ cloud_storage_path, url }`
- **Only works when**: `USE_LOCAL_STORAGE=true` or AWS not configured

#### `POST /api/upload/file-url`
Get file URL (S3 or local)
- Body: `{ cloud_storage_path, isPublic }`
- Returns: `{ url }`

#### Multipart Upload Endpoints
- `POST /api/upload/multipart/initiate` - Start multipart upload
- `POST /api/upload/multipart/part` - Upload a part
- `POST /api/upload/multipart/complete` - Complete upload

### Organization Endpoints

#### Schools
- `GET /api/schools` - List all schools
- `POST /api/schools` - Create school
- `GET /api/schools/[id]` - Get school details
- `PATCH /api/schools/[id]` - Update school
- `DELETE /api/schools/[id]` - Delete school

#### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/[id]` - Get team details
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

#### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Design Asset Endpoints

#### Items (Design Templates)
- `GET /api/items` - List all items
- `POST /api/items` - Create item
- `GET /api/items/[id]` - Get item details
- `POST /api/items/[id]/variants/generate` - Generate variants

#### Logos, Patterns, Fonts, Colors, Embellishments
- `GET /api/[resource]` - List all
- `POST /api/[resource]` - Create
- `GET /api/[resource]/[id]` - Get details
- `PATCH /api/[resource]/[id]` - Update
- `DELETE /api/[resource]/[id]` - Delete

### E-commerce Endpoints

#### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add to cart
- `PATCH /api/cart` - Update cart
- `DELETE /api/cart` - Clear cart

#### Orders
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details

---

## Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  password      String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  creatorDesigns CreatorDesign[]
}
```

### CreatorDesign Model (New)
```prisma
model CreatorDesign {
  id           String    @id @default(cuid())
  name         String
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  schoolId     String?
  school       School?   @relation(fields: [schoolId], references: [id], onDelete: SetNull)
  teamId       String?
  team         Team?     @relation(fields: [teamId], references: [id], onDelete: SetNull)
  projectId    String?
  project      Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  itemId       String?
  item         Item?     @relation(fields: [itemId], references: [id], onDelete: SetNull)
  designData   String    @db.Text // JSON string of design configuration
  previewImage String?   // URL to a preview image
  apparelType  String    @default("tshirt")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
  @@index([schoolId])
  @@index([teamId])
  @@index([projectId])
  @@index([itemId])
}
```

### Template Model (Updated)
```prisma
model Template {
  id           String   @id @default(cuid())
  name         String
  category     String
  filePath     String?  // Now optional
  fileIsPublic Boolean  @default(false)
  svgPath      String?
  svgIsPublic  Boolean  @default(false)
  layerData    String?  @db.Text // JSON string with layer information
  description  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  items        Item[]
}
```

### Organization Models
- **School**: Top-level organization
- **Team**: Belongs to a School
- **Project**: Belongs to a Team
- **Item**: Design template, belongs to a Project

### Design Asset Models
- **Template**: Template files (.ai, .jpeg, .png, .svg)
- **Logo**: Logo files
- **Pattern**: Pattern files
- **Font**: Font definitions
- **Color**: Color definitions (Pantone support)
- **Embellishment**: Embellishment graphics

### E-commerce Models
- **Cart**: User's shopping cart
- **Order**: Completed orders
- **OrderItem**: Items in an order

### Variant Models
- **Variant**: Generated design variant
- **DesignInstruction**: Instructions for bridge utility

---

## Navigation & Sidebars

### Left Sidebar Navigation

The left sidebar provides main navigation based on user role:

**Admin Navigation:**
1. Dashboard - Overview and statistics
2. Creator - Design creation tool
3. Schools - School management
4. Teams - Team management
5. Projects - Project management
6. Items - Design item management
7. Cart - Shopping cart
8. Orders - Order management
9. User Management - Admin user management

**User Navigation:**
1. Creator - Design creation tool
2. Teams - Team access
3. Projects - Project access
4. Items - Design items
5. Cart - Shopping cart
6. Orders - Order history

### Right Sidebar - Design Library

Quick access to design assets:
1. **Logos** - Logo library
2. **Templates** - Design templates
3. **Fonts** - Font library
4. **Patterns** - Pattern library
5. **Colors** - Color library
6. **Embellishments** - Embellishment library

### Implementation

- **Collapsible**: Both sidebars can be collapsed
- **Responsive**: Mobile uses Sheet components
- **Active State**: Current route is highlighted
- **Icons**: Lucide React icons for all menu items

---

## File Storage System

### Overview

The system supports two storage backends:
1. **AWS S3** (primary) - Cloud storage
2. **Local Storage** (fallback) - Filesystem storage

### Storage Selection

The system automatically selects storage based on configuration:

1. **If `USE_LOCAL_STORAGE=true`**: Always uses local storage
2. **If `AWS_BUCKET_NAME` not set**: Uses local storage
3. **If AWS configured**: Uses AWS S3
4. **If AWS fails**: Automatically falls back to local storage

### Local Storage

**Location**: `public/uploads/`
- Private files: `public/uploads/`
- Public files: `public/uploads/public/`

**URLs**: Files accessible at `http://localhost:3000/uploads/...`

**Features**:
- Automatic directory creation
- No external dependencies
- Perfect for development
- Files served directly by Next.js

### AWS S3 Storage

**Configuration**:
- Bucket name: `AWS_BUCKET_NAME`
- Region: `AWS_REGION`
- Folder prefix: `AWS_FOLDER_PREFIX`
- Credentials: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

**Features**:
- Presigned URLs for direct uploads
- Multipart upload support for large files
- Public and private file support
- Automatic URL generation

### File Upload Component

The `FileUpload` component automatically:
- Detects storage mode
- Uses appropriate upload method
- Handles both single-part and multipart uploads
- Shows progress indicators
- Validates file sizes

---

## Template System

### Template Creation

Templates can be created with:
- **Name** (required)
- **Category** (required)
- **Template File** (optional): `.ai`, `.jpeg`, `.jpg`, `.png`, or `.svg`
- **SVG Preview File** (optional): For layer editing
- **Description** (optional)

### Template Layer Editor

**Access**: Click "Edit Layers" button on templates with SVG files

**Features**:
- **Text Editing**: Edit text content for text layers
- **Color Editing**: Change fill and stroke colors
- **Live Preview**: See changes in real-time
- **Save Changes**: Persist modifications to database

**Workflow**:
1. Create template with SVG file
2. System automatically parses layers
3. Click "Edit Layers" to open editor
4. Make changes to text/colors
5. Preview updates automatically
6. Save changes to update template

### Template Library

Templates are stored in the database and accessible from:
- **Templates Page**: `/templates` - Full management interface
- **Right Sidebar**: Quick access link
- **Creator Tool**: Browse and add templates to designs

---

## Creator Tool

### Overview

The Enhanced Creator is a powerful design tool for creating custom apparel designs.

### Features

#### File Management
- **PNG Mask**: Upload PNG file for color application (optional)
- **SVG Boundaries**: Upload SVG file that defines design boundaries (required)
- **Automatic Detection**: Detects layers and objects in SVG
- **Apparel Detection**: Identifies t-shirt, hoodie, etc. in SVG

#### Template Management
- **Add Templates**: Browse and select from template library
- **Template Positioning**: 
  - Drag-and-drop in preview
  - Slider controls for precise positioning
  - X/Y position (0-100%)
  - Width/Height (5-50%)
  - Boundary constraints
- **Template Customization**:
  - Upload custom logo (SVG)
  - Edit text content
  - Flip horizontally
  - Adjust size and position

#### Design Saving
- **Save Designs**: Save complete design configurations
- **Load Designs**: Load saved designs for editing
- **Update Designs**: Modify existing designs
- **Delete Designs**: Remove unwanted designs
- **Gallery View**: Browse all saved designs

### Workflow

1. **Upload Files**:
   - Upload SVG boundaries file
   - Optionally upload PNG mask

2. **Add Templates**:
   - Click "Add Template" in Templates tab
   - Browse template library
   - Select template to add

3. **Position Templates**:
   - Click "Select" on template card
   - Use sliders or drag in preview
   - Adjust width/height as needed

4. **Customize**:
   - Edit text content
   - Upload custom logos
   - Flip templates if needed

5. **Save Design**:
   - Enter design name
   - Click "Save Design"
   - Design saved to database

---

## Development Workflow

### Running the Development Server

```bash
# Option 1: Standard npm/yarn
cd apparel_design_manager/nextjs_space
npm run dev

# Option 2: Use convenience script
./run_Eira.sh
```

### Code Structure

- **Pages**: Next.js App Router pages in `app/`
- **Components**: Reusable React components in `components/`
- **API Routes**: Server-side API endpoints in `app/api/`
- **Utilities**: Helper functions in `lib/`
- **Types**: TypeScript type definitions in `types/`

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI
- **Custom CSS**: Global styles in `app/globals.css`

### Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name
```

### TypeScript

- Strict mode enabled
- Type definitions for NextAuth extended
- Prisma types generated automatically

---

## Troubleshooting

### Authentication Issues

**Problem**: Login fails or authentication errors

**Solutions**:
1. **Development Mode**: Authentication is disabled - auto-sign-in should work
2. If re-enabled: Check `NEXTAUTH_SECRET` is set in `.env`
3. Verify `NEXTAUTH_URL` matches your application URL
4. Ensure database connection is working
5. Clear browser cookies and try again

### File Upload Issues

**Problem**: "Failed to generate upload url" error

**Solutions**:
1. **Check Storage Mode**: 
   - If `USE_LOCAL_STORAGE=true`, local storage is used
   - If AWS not configured, automatically uses local storage
2. **For AWS**: Verify AWS credentials in `.env`
3. **For Local**: Ensure `public/uploads/` directory exists
4. Check server logs for specific error messages

**Problem**: Files not uploading

**Solutions**:
1. Check file size limits (default 100MB for single-part)
2. Verify file type is accepted
3. Check browser console for errors
4. Verify storage backend is working

### Database Issues

**Problem**: Creator design save fails

**Solutions**:
1. Run `npx prisma db push` to sync schema
2. Verify `CreatorDesign` model exists in schema
3. Check database connection
4. Ensure mock user exists (auto-created on first save)

**Problem**: Template creation fails

**Solutions**:
1. Verify `filePath` is optional (can be null)
2. Check database schema is up to date
3. Run `npx prisma generate` to regenerate client

### Template Layer Editor Issues

**Problem**: Layers not showing

**Solutions**:
1. Ensure template has `svgPath` and `layerData`
2. Upload SVG file when creating template
3. System automatically parses layers on SVG upload
4. Check browser console for parsing errors

**Problem**: Changes not saving

**Solutions**:
1. Verify template has valid `layerData`
2. Check API route is accessible
3. Check browser console for errors
4. Verify database connection

### Sidebar Not Showing

**Problem**: Navigation items not appearing

**Solutions**:
1. Check user role is correctly set (or authentication disabled)
2. Verify session is active
3. Check browser console for errors
4. Ensure `left-sidebar.tsx` has correct navigation arrays

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:
1. Run `npx prisma generate` to regenerate types
2. Check for missing dependencies: `npm install`
3. Clear `.next` folder and rebuild
4. Check TypeScript errors: `npx tsc --noEmit`

---

## Additional Resources

### Cursor IDE Rules

- **Party Mode**: Located in `.cursor/rules/party-mode.mdc`
  - Enables enthusiastic, celebratory interactions
  - Always applied to all requests

### Scripts

- **`run_Eira.sh`**: Development server restart script
  - Kills existing processes
  - Installs dependencies if needed
  - Starts fresh dev server

### External Documentation

- Next.js: https://nextjs.org/docs
- NextAuth.js: https://next-auth.js.org/
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- AWS SDK: https://docs.aws.amazon.com/sdk-for-javascript/

---

## Version History

### Latest Changes (Current)

- ✅ Template layer editor with live preview
- ✅ Template selector in creator tool
- ✅ Enhanced file upload support (.ai, .jpeg, .png, .svg)
- ✅ Creator design save functionality
- ✅ Local file storage fallback
- ✅ Template positioning controls
- ✅ Authentication disabled for development
- ✅ AWS connection verified and working
- ✅ Improved error handling throughout

---

## Support & Contact

For issues, questions, or contributions:
- Check this documentation first
- Review troubleshooting section
- Check GitHub issues (if applicable)
- Contact development team

---

**Last Updated**: January 2025
**Documentation Version**: 2.0.0
