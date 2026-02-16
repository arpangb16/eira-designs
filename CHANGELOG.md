# Changelog

All notable changes to the Eira Designs project will be documented in this file.

## [Unreleased]

### Added
- Comprehensive project documentation (`DOCUMENTATION.md`)
- Party mode Cursor rule (`.cursor/rules/party-mode.mdc`)
- Development server restart script (`run_Eira.sh`)
- SVG template parser utility (`lib/svg-template-parser.ts`)

### Changed
- **Navigation**: Removed Templates, Logos, Patterns, Embellishments, Colors, and Fonts from left sidebar
- **Navigation**: Added Logos to right sidebar as first item
- **Authentication**: Fixed authentication errors by storing role in JWT token instead of querying database
- **Type Definitions**: Updated NextAuth types to include role property

### Fixed
- Authentication errors on login (database query in session callback)
- Missing svg-template-parser import error
- Type errors for user role in session

## [2025-01-XX] - Recent Updates

### Authentication System
- Modified `lib/auth-options.ts` to fetch and store user role in JWT token
- Removed database query from session callback for better performance
- Updated `types/next-auth.d.ts` to include role in Session interface

### Navigation System
- **Left Sidebar**:
  - Admin: Dashboard, Creator, Schools, Teams, Projects, Items, Cart, Orders, User Management
  - User: Creator, Teams, Projects, Items, Cart, Orders
- **Right Sidebar**:
  - Logos, Templates, Fonts, Patterns, Colors, Embellishments

### Development Tools
- Created `run_Eira.sh` script for easy localhost restart
- Added party mode rule for Cursor IDE interactions

---

## Notes

- All changes are committed to the main branch
- Documentation is maintained in `DOCUMENTATION.md`
- For detailed information, see the main documentation file


