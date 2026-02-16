# Changelog

All notable changes to the Eira Designs project will be documented in this file.

## [Unreleased]

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
