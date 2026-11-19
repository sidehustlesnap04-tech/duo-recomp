'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createDuo(_prev: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get('name') ?? '').trim() || 'Our challenge';
  const startsOn = String(formData.get('starts_on') ?? '') || null;

  const supabase = createClient();
  const { error } = await supabase.rpc('create_duo', { duo_name: name, start_on: startsOn });
  if (error) return 'Could not create the challenge. Try again.';

  revalidatePath('/', 'layout');
  redirect('/today');
}

export async function acceptInvite(_prev: string | null, formData: FormData): Promise<string | null> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return 'Paste the invitation code first.';

  const supabase = createClient();
  const { error } = await supabase.rpc('accept_invite', { invite_code: code });
  // The function returns one generic failure for every invalid case, by design.
  if (error) return 'That invitation is not valid. Ask your partner for a fresh link.';

  revalidatePath('/', 'layout');
  redirect('/today');
}
