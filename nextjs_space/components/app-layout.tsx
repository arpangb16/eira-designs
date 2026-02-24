'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';
import { AppHeader } from './app-header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  
  // Don't show sidebars on login/signup pages
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/';

  if (isAuthPage) {
    return <>{children}</>;
  }

  const isAdmin = !session || session?.user?.role === 'ADMIN';

  return (
    <div className="relative flex min-h-screen">
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          isAdmin ? 'lg:ml-64 lg:mr-64' : 'lg:ml-64' // Space for both sidebars only for admin
        )}
      >
        <AppHeader />
        <div className="p-6">{children}</div>
      </main>

      {/* Right Sidebar - Only shown for admins */}
      <RightSidebar />
    </div>
  );
}
