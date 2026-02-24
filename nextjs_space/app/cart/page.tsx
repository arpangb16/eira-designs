import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import CartClient from './_components/cart-client';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <CartClient />;
}
