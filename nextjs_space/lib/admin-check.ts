import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function requireAdmin() {
  // AUTHENTICATION DISABLED - Return mock admin session
  return {
    user: {
      id: 'mock-user-id',
      email: 'admin@eira.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  } as any;
  
  // Original authentication code (disabled):
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   redirect('/login');
  // }
  // const user = await prisma.user.findUnique({
  //   where: { id: session.user.id },
  //   select: { role: true },
  // });
  // if (user?.role !== 'ADMIN') {
  //   redirect('/creator');
  // }
  // return session;
}

export async function requireAuth() {
  // AUTHENTICATION DISABLED - Return mock session
  return {
    user: {
      id: 'mock-user-id',
      email: 'admin@eira.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  } as any;
  
  // Original authentication code (disabled):
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   redirect('/login');
  // }
  // return session;
}
