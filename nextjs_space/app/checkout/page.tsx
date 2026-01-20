import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import CheckoutClient from './_components/checkout-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <CheckoutClient />;
}
