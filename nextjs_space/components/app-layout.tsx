'use client';

import { usePathname } from 'next/navigation';
import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';
import { AppHeader } from './app-header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  
  // Don't show sidebars on login/signup pages
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          'lg:ml-64 lg:mr-64' // Space for both sidebars on desktop
        )}
      >
        <AppHeader />
        <div className="p-6">{children}</div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
}
