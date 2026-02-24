# Changelog

All notable changes to the Eira Designs project will be documented in this file.

## [Unreleased]

### Added (Session 2026-02-24)
- **Auth Bypass & Admin Default** (`BYPASS_AUTH` env var)
  - `get-session.ts`: Returns mock admin session when `BYPASS_AUTH=true`
  - Server session passed to `SessionProvider` for client-side admin view
  - `auth-options.ts`: All logged-in users treated as admin (role always ADMIN)
  - Default to admin view when no session (`!session || role === 'ADMIN'`)
- **Creator Template Migration**
  - "Add to Template" button in Creator editor (adds current template to Templates library)
  - "Migrate All to Templates" button in Creator gallery (one-time migration of 9 built-in templates)
  - POST `/api/creator/add-to-template` - add single creator template
  - POST `/api/creator/migrate-to-templates` - migrate all creator templates
- **Add New Image in Creator**
  - "Add New Image" button in Creator gallery with dialog
  - Upload SVG file, enter template name, creates Template record (category: Creator)
  - GET `/api/creator/templates` - returns built-in 9 + custom templates from DB
  - POST `/api/creator/templates` - create new creator template from upload
  - Custom templates loaded from API; built-in 9 always load from static files
- **Creator in Left Sidebar** - Added Creator to admin left navigation (after Projects)

### Changed (Session 2026-02-24)
- **run_Eira.sh** - Flexible path: tries `nextjs_space` then `apparel_design_manager/nextjs_space`
- **Left/Right Sidebar** - Default to admin view when no session
- **Right Sidebar** - Removed Creator from Design Library (Creator only in left sidebar)
- **Templates Page** - Public paths (`/creator/`) fetch SVG directly; no file-url API
- **Item Detail & Visual Editor** - Public paths (`/creator/`) fetch SVG directly for correct preview

### Fixed (Session 2026-02-24)
- **SVG Preview under Items** - Creator templates (`/creator/images/*.svg`) were incorrectly resolved via S3 file-url API; now fetched directly from app for correct display
- **DialogTrigger** - Added missing import in creator-client.tsx

### Fixed
- **NPM Dependency Installation**: Fixed `next: not found` error by installing dependencies with `--legacy-peer-deps` flag
  - Updated `run_Eira.sh` script to automatically use `--legacy-peer-deps` when installing dependencies
  - Resolved TypeScript ESLint peer dependency conflicts
  - Added troubleshooting documentation for npm dependency issues

### Added
- **Template Layer Editor** (`app/templates/_components/template-layer-editor.tsx`)
  - Full-featured editor for editing template layers
  - Text editing for text layers
  - Color editing (fill/stroke) for graphic layers
  - Live preview of changes in real-time
  - Save modified layer data back to templates
- **Template Selector in Creator** (`app/creator/_components/template-selector.tsx`)
  - Browse templates from database
  - Search functionality (name, category, description)
  - Visual preview with SVG previews
  - One-click template addition to creator designs
- **Local File Storage** (`lib/local-storage.ts`, `app/api/upload/local/route.ts`)
  - Automatic fallback when AWS not configured
  - Files saved to `public/uploads/` directory
  - Seamless switching between AWS and local storage
  - Environment variable: `USE_LOCAL_STORAGE=true` to force local storage
- **Creator Design CRUD** (`app/api/creator-designs/route.ts`, `app/api/creator-designs/[id]/route.ts`)
  - Save creator designs with full configuration
  - Load saved designs for editing
  - Update existing designs
  - Delete designs
  - Preview image support
- **CreatorDesign Database Model** (`prisma/schema.prisma`)
  - New model for storing creator designs
  - Links to organization hierarchy
  - JSON storage for flexible design data
- **Enhanced Template Creation**
  - Support for `.ai`, `.jpeg`, `.jpg`, `.png`, and `.svg` files
  - All file types are optional (no longer required)
  - Better file type validation
- **Template Positioning System**
  - Drag-and-drop positioning in preview
  - Slider controls for X, Y, width, height
  - Boundary constraints to keep templates within SVG boundaries
  - Horizontal flip functionality
- **AWS Connection Testing** (`test-aws-connection.js`)
  - Script to verify AWS S3 connection
  - Tests presigned URL generation
  - Validates credentials and bucket access
- Comprehensive project documentation (`DOCUMENTATION.md`)
- Party mode Cursor rule (`.cursor/rules/party-mode.mdc`)
- Development server restart script (`run_Eira.sh`)
- SVG template parser utility (`lib/svg-template-parser.ts`)
- Quick reference guide (`QUICK_REFERENCE.md`)

### Changed
- **Template Model**: `filePath` is now optional (nullable)
- **File Upload System**: Automatic fallback to local storage
- **Authentication**: Disabled for development (all users can access all features)
- **Template Creation**: File upload is optional, supports multiple file types
- **Navigation**: Removed Templates, Logos, Patterns, Embellishments, Colors, and Fonts from left sidebar
- **Navigation**: Added Logos to right sidebar as first item
- **Authentication**: Fixed authentication errors by storing role in JWT token instead of querying database
- **Type Definitions**: Updated NextAuth types to include role property
- **Error Handling**: Improved error messages and logging throughout

### Fixed
- Creator design save functionality (added CreatorDesign model to database)
- File upload errors (automatic fallback to local storage)
- Authentication errors on login (database query in session callback)
- Missing svg-template-parser import error
- Type errors for user role in session
- Select component empty value errors (changed to "none")
- AWS connection issues (lazy initialization, better error handling)

## [2025-01-XX] - Template System Enhancements

### Template Layer Editor
- Created full-featured layer editor component
- Real-time preview of text and color changes
- Save modified layer data to database
- Two-tab interface (Text / Colors)
- Color picker with hex input

### Template Selector
- Browse templates from database in creator
- Search and filter functionality
- Visual preview with SVG previews
- One-click template addition

### Enhanced File Upload
- Support for `.ai`, `.jpeg`, `.jpg`, `.png`, `.svg` files
- All file types optional in template creation
- Better MIME type handling
- Improved file validation

## [2025-01-XX] - Creator Tool Enhancements

### Design Saving
- Complete CRUD operations for creator designs
- Save designs with all template configurations
- Load saved designs for editing
- Update and delete functionality
- Gallery view for browsing designs

### Template Positioning
- Drag-and-drop positioning
- Slider controls for precise positioning
- X/Y position (0-100%)
- Width/Height (5-50%)
- Boundary constraints
- Horizontal flip

### File Management
- PNG mask upload (optional)
- SVG boundaries upload (required)
- Automatic layer detection
- Apparel type detection

## [2025-01-XX] - File Storage System

### Local Storage Fallback
- Automatic fallback when AWS not configured
- Files saved to `public/uploads/` directory
- Environment variable to force local storage
- Seamless switching between storage backends

### AWS S3 Integration
- Verified AWS connection working
- Presigned URL generation tested
- Better error handling and logging
- Lazy client initialization

## [2025-01-XX] - Authentication Updates

### Development Mode
- Authentication disabled for easier development
- Auto-sign-in on login page
- Mock admin user automatically created
- All users can access all features
- Easy to re-enable when needed

### Authentication Fixes
- Modified `lib/auth-options.ts` to fetch and store user role in JWT token
- Removed database query from session callback for better performance
- Updated `types/next-auth.d.ts` to include role in Session interface

## [2025-01-XX] - Navigation System

### Left Sidebar
- Admin: Dashboard, Creator, Schools, Teams, Projects, Items, Cart, Orders, User Management
- User: Creator, Teams, Projects, Items, Cart, Orders
- Removed: Templates, Logos, Patterns, Embellishments, Colors, Fonts

### Right Sidebar
- Logos, Templates, Fonts, Patterns, Colors, Embellishments
- Logos added as first item

## [2025-01-XX] - Development Tools

### Scripts
- Created `run_Eira.sh` script for easy localhost restart
- Kills existing processes
- Installs dependencies if needed
- Starts fresh dev server

### Documentation
- Comprehensive documentation in `DOCUMENTATION.md`
- Quick reference guide in `QUICK_REFERENCE.md`
- Changelog in `CHANGELOG.md`

### Cursor IDE
- Added party mode rule for enthusiastic interactions
- Always applied to all requests

---

## Notes

- All changes are committed to the `feature/template-enhancements` branch
- Main branch updated with submodule reference
- Documentation is maintained in `DOCUMENTATION.md`
- For detailed information, see the main documentation file
