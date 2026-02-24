import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import CreatorClient from './_components/creator-client';

export const dynamic = 'force-dynamic';

export default async function CreatorPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <CreatorClient />;
}
