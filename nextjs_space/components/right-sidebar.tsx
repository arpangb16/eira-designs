'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  FileImage,
  Type,
  Grid3x3,
  Palette,
  Sparkles,
  Wand2,
  Image,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const adminNavigation = [
  { name: 'Templates', href: '/templates', icon: FileImage },
  { name: 'Logos', href: '/logos', icon: Image },
  { name: 'Fonts', href: '/fonts', icon: Type },
  { name: 'Patterns', href: '/patterns', icon: Grid3x3 },
  { name: 'Colors', href: '/colors', icon: Palette },
  { name: 'Embellishments', href: '/embellishments', icon: Sparkles },
  { name: 'Creator', href: '/creator', icon: Wand2 },
];

// Regular users don't see the design library sidebar
const userNavigation: typeof adminNavigation = [];

export function RightSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession() || {};
  
  const isAdmin = session?.user?.role === 'ADMIN';
  const navigation = isAdmin ? adminNavigation : userNavigation;

  // Don't render right sidebar for non-admin users
  if (!isAdmin) {
    return null;
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!collapsed && (
          <h2 className="text-sm font-semibold text-muted-foreground">
            Design Library
          </h2>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0')} />
                {(!collapsed || mobile) && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Info Section */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="rounded-lg bg-muted p-3">
            <h3 className="text-xs font-semibold mb-1">Asset Library</h3>
            <p className="text-xs text-muted-foreground">
              Manage design assets for your projects
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 right-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block fixed right-0 top-0 z-40 h-screen border-l bg-background transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
