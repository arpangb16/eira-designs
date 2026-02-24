import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import OrdersClient from './_components/orders-client';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <OrdersClient />;
}
