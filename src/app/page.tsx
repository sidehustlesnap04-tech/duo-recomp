import { redirect } from 'next/navigation';
import { loadSession } from '@/lib/duo';

export default async function Home() {
  const { user, duo } = await loadSession();
  if (!user) redirect('/sign-in');
  if (!duo) redirect('/onboarding');
  redirect('/today');
}
