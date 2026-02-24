import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/db';
import { UsersClient } from './_components/users-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'ADMIN') {
    redirect('/creator');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return <UsersClient initialUsers={serializedUsers} currentUserId={session.user.id} />;
}
