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
| `run_Eira.sh` | Development server restart script |
| `.cursor/rules/party-mode.mdc` | Cursor IDE party mode rule |

## 🔑 Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
AWS_BUCKET_NAME="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
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

- **Login**: `/login`
- **Signup**: `/signup`
- **Roles**: ADMIN, USER
- **Session**: JWT-based with role stored in token

## 📡 Common API Endpoints

```
GET    /api/schools
POST   /api/schools
GET    /api/teams
POST   /api/teams
GET    /api/projects
POST   /api/projects
GET    /api/items
POST   /api/items/[id]/variants/generate
GET    /api/cart
POST   /api/cart
GET    /api/orders
POST   /api/orders
```

## 🛠️ Common Tasks

### Add New Menu Item
1. Update `components/left-sidebar.tsx` or `components/right-sidebar.tsx`
2. Add icon import from `lucide-react`
3. Add to navigation array

### Create New API Route
1. Create file in `app/api/[resource]/route.ts`
2. Export GET, POST, PATCH, DELETE handlers
3. Add authentication/authorization checks

### Add New Component
1. Create file in `components/`
2. Use TypeScript
3. Follow existing component patterns
4. Use shadcn/ui components when possible

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails | Check NEXTAUTH_SECRET, verify DB connection |
| Sidebar not showing | Check user role, verify session |
| Build errors | Run `npx prisma generate`, clear `.next` |
| File upload fails | Verify AWS credentials, check S3 bucket |

## 📚 Documentation

- **Full Docs**: See `DOCUMENTATION.md`
- **Changes**: See `CHANGELOG.md`
- **Project README**: See `apparel_design_manager/README.md`

## 🎯 Development Workflow

1. Make changes
2. Test locally (`./run_Eira.sh`)
3. Check for TypeScript errors
4. Test authentication if auth-related
5. Commit changes
6. Push to main branch

---

**Need more details?** Check `DOCUMENTATION.md` for comprehensive information!


