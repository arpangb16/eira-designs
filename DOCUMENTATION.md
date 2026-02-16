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
10. [Development Workflow](#development-workflow)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Eira Designs** is a comprehensive apparel design management system that enables teams to create, manage, and generate production-ready design files. The system integrates with Adobe Illustrator through a bridge utility to automate the creation of final design files.

### Key Features

- 🎨 **Dynamic Design Management**: Layer-based configuration system for SVG templates
- 👥 **Organization Hierarchy**: Schools → Teams → Projects → Items
- 🎨 **Design Asset Library**: Colors, Fonts, Patterns, Embellishments, Logos
- 🛒 **Shopping Cart & Orders**: E-commerce functionality for design purchases
- 🔐 **Role-Based Access Control**: Admin and User roles with different permissions
- ☁️ **Cloud Storage**: AWS S3 integration for all file storage
- 🎨 **Design Creator**: Interactive SVG editor for custom designs
- 🔗 **Adobe Bridge Integration**: Automated .AI file generation

---

## Recent Changes

### Navigation Updates (Latest)

#### Left Sidebar
- **Removed**: Templates, Logos, Patterns, Embellishments, Colors, Fonts
- **Current Menu Items**:
  - **Admin Users**: Dashboard, Creator, Schools, Teams, Projects, Items, Cart, Orders, User Management
  - **Regular Users**: Creator, Teams, Projects, Items, Cart, Orders

#### Right Sidebar
- **Added**: Logos (now first item)
- **Current Menu Items**: Logos, Templates, Fonts, Patterns, Colors, Embellishments

### Authentication Fixes

**Issue**: Authentication errors on login due to database queries in session callback.

**Solution**: 
- Modified `auth-options.ts` to store user role in JWT token during login
- Removed database query from session callback
- Role is now fetched once during authentication and stored in token

**Files Modified**:
- `lib/auth-options.ts`: Updated JWT and session callbacks
- `types/next-auth.d.ts`: Added role to Session type definition

### New Files Created

1. **`.cursor/rules/party-mode.mdc`**: Cursor AI rule for enthusiastic interactions
2. **`run_Eira.sh`**: Script to restart localhost development server
3. **`lib/svg-template-parser.ts`**: SVG template parsing utilities (moved from other location)

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
│   │   │   │   ├── logos/        # Logo management
│   │   │   │   ├── patterns/     # Pattern management
│   │   │   │   ├── fonts/        # Font management
│   │   │   │   ├── colors/       # Color management
│   │   │   │   ├── embellishments/ # Embellishment management
│   │   │   │   ├── cart/         # Shopping cart
│   │   │   │   ├── orders/       # Order management
│   │   │   │   ├── bridge/       # Adobe Bridge integration
│   │   │   │   └── upload/       # File upload endpoints
│   │   │   ├── admin/            # Admin pages
│   │   │   ├── dashboard/        # Dashboard page
│   │   │   ├── creator/          # Design creator page
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
│   │   │   └── [other components]
│   │   ├── lib/                   # Utility libraries
│   │   │   ├── auth-options.ts   # NextAuth configuration
│   │   │   ├── db.ts             # Prisma client
│   │   │   ├── s3.ts             # AWS S3 utilities
│   │   │   ├── svg-template-parser.ts # SVG parsing
│   │   │   └── [other utilities]
│   │   ├── prisma/               # Database
│   │   │   └── schema.prisma     # Prisma schema
│   │   ├── types/                # TypeScript type definitions
│   │   └── public/               # Static assets
│   ├── bridge_utility/           # Adobe Illustrator bridge
│   └── README.md                 # Project README
├── .cursor/                      # Cursor IDE configuration
│   └── rules/                    # Cursor rules
│       └── party-mode.mdc        # Party mode rule
├── run_Eira.sh                   # Development server restart script
└── DOCUMENTATION.md              # This file
```

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** database
- **AWS S3** bucket (for file storage)
- **Adobe Illustrator** (for bridge utility - optional)

### Environment Variables

Create a `.env` file in `apparel_design_manager/nextjs_space/`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/apparel_db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="apparel-designs/"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
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
   - Sign up for a new account or log in

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

The application uses **NextAuth.js** with JWT strategy for authentication. User roles are stored in the JWT token to avoid database queries on every session access.

### Authentication Flow

1. **Login**: User submits email/password
2. **Authorize**: `auth-options.ts` validates credentials against database
3. **JWT Creation**: User ID and role stored in JWT token
4. **Session**: Role retrieved from token (no DB query needed)

### User Roles

- **ADMIN**: Full access to all features including user management
- **USER**: Standard access to design creation and management

### Files

- **`lib/auth-options.ts`**: NextAuth configuration
  - Credentials provider
  - JWT callbacks
  - Session callbacks
- **`app/api/auth/[...nextauth]/route.ts`**: NextAuth API route handler
- **`types/next-auth.d.ts`**: TypeScript definitions for NextAuth

### Key Implementation Details

```typescript
// Role is fetched during login and stored in JWT
async authorize(credentials) {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: { id: true, email: true, name: true, password: true, role: true },
  })
  // ... password validation ...
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

// Role retrieved from token (no DB query)
async session({ session, token }) {
  session.user.role = token.role as string
  return session
}
```

### Protected Routes

- **Admin Routes**: `/admin/*` - Requires ADMIN role
- **Authenticated Routes**: Most pages require authentication
- **Public Routes**: `/login`, `/signup`

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

### Design Components

#### `svg-editor.tsx`
Interactive SVG editor for:
- Viewing SVG designs
- Editing text elements
- Changing colors
- Adding logos and patterns

#### `creator-client.tsx`
Main design creator component:
- Template selection
- Layer configuration
- Variant generation
- Design preview

### UI Components

All UI components are from **shadcn/ui**:
- Button, Input, Card, Dialog, Sheet, etc.
- Located in `components/ui/`
- Fully customizable with Tailwind CSS

---

## API Documentation

### Authentication Endpoints

#### `POST /api/auth/[...nextauth]`
NextAuth.js handler for authentication.

### User Management

#### `GET /api/users`
Get all users (Admin only)
- Requires: ADMIN role
- Returns: Array of users

#### `PATCH /api/users`
Update user role (Admin only)
- Body: `{ userId: string, role: 'ADMIN' | 'USER' }`
- Requires: ADMIN role

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

#### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `POST /api/templates/parse-svg` - Parse SVG file

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

### File Upload Endpoints

#### `POST /api/upload/presigned`
Get presigned URL for direct S3 upload
- Returns: `{ url: string, key: string }`

#### `POST /api/upload/multipart/initiate`
Initiate multipart upload for large files

#### `POST /api/upload/multipart/part`
Upload a part of multipart upload

#### `POST /api/upload/multipart/complete`
Complete multipart upload

### Bridge Endpoints

#### `GET /api/bridge/jobs`
Get pending bridge jobs

#### `GET /api/bridge/jobs/[id]`
Get job status

#### `POST /api/bridge/upload`
Upload completed .AI file from bridge

---

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Organization Models
- **School**: Top-level organization
- **Team**: Belongs to a School
- **Project**: Belongs to a Team
- **Item**: Design template, belongs to a Project

### Design Asset Models
- **Template**: SVG template files
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

**Problem**: Login fails with authentication error

**Solutions**:
1. Check `NEXTAUTH_SECRET` is set in `.env`
2. Verify `NEXTAUTH_URL` matches your application URL
3. Ensure database connection is working
4. Check user exists in database with correct password hash
5. Clear browser cookies and try again

**Recent Fix**: Authentication now stores role in JWT token instead of querying database on every session access.

### Database Connection Issues

**Problem**: Cannot connect to database

**Solutions**:
1. Verify `DATABASE_URL` in `.env` is correct
2. Check PostgreSQL is running
3. Ensure database exists
4. Run `npx prisma db push` to sync schema

### File Upload Issues

**Problem**: Files not uploading to S3

**Solutions**:
1. Verify AWS credentials in `.env`
2. Check S3 bucket exists and is accessible
3. Verify bucket permissions
4. Check `AWS_REGION` matches bucket region

### Sidebar Not Showing

**Problem**: Navigation items not appearing

**Solutions**:
1. Check user role is correctly set
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

---

## Version History

### Latest Changes (Current)

- ✅ Fixed authentication errors (JWT role storage)
- ✅ Updated sidebar navigation (removed design assets from left, added logos to right)
- ✅ Created party mode Cursor rule
- ✅ Added development server restart script
- ✅ Fixed svg-template-parser import issue
- ✅ Updated type definitions for NextAuth

---

## Support & Contact

For issues, questions, or contributions:
- Check this documentation first
- Review troubleshooting section
- Check GitHub issues (if applicable)
- Contact development team

---

**Last Updated**: January 2025
**Documentation Version**: 1.0.0


