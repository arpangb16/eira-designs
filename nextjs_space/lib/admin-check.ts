import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // When bypassing auth, mock user has ADMIN role
  if (process.env.BYPASS_AUTH === 'true') {
    return session;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/creator');
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return session;
}
