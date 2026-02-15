import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import CartClient from './_components/cart-client';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <CartClient />;
}
