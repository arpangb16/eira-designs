import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import CheckoutClient from './_components/checkout-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <CheckoutClient />;
}
