'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return 'Email and password are both needed.';

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const code = error.code ?? '';
    const msg = error.message.toLowerCase();
    if (code === 'email_not_confirmed' || msg.includes('not confirmed')) {
      return 'This account exists but the email has not been confirmed yet. Check your inbox, or turn off email confirmation in Supabase.';
    }
    if (code === 'over_request_rate_limit' || msg.includes('rate limit')) {
      return 'Too many attempts. Wait a minute and try again.';
    }
    if (code === 'invalid_credentials' || msg.includes('invalid login')) {
      return 'That email and password do not match an account. If you have not signed up yet, use "Create one" below.';
    }
    return error.message;
  }

  revalidatePath('/', 'layout');
  redirect(String(formData.get('next') || '/today'));
}

export async function signUp(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();
  if (!email || !password || !displayName) return 'Name, email and password are all needed.';
  if (password.length < 8) return 'Use at least 8 characters for the password.';

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } }
  });
  if (error) {
    const code = error.code ?? '';
    const msg = error.message.toLowerCase();
    if (code === 'signup_disabled' || msg.includes('signups are disabled') || msg.includes('signup is disabled')) {
      return 'New sign-ups are switched off for this app. Ask Amr to turn "Allow new users to sign up" back on in Supabase, then try again.';
    }
    if (msg.includes('already registered') || code === 'user_already_exists') {
      return 'There is already an account with that email. Sign in instead.';
    }
    if (msg.includes('password')) {
      return 'That password is too short — use at least 8 characters.';
    }
    return error.message;
  }

  // With email confirmation on, sign-up returns a user but no session. Redirecting
  // into the app here would bounce straight back to sign-in with no explanation.
  if (!data.session) {
    return 'Account created. Confirm your email address, then sign in.';
  }

  revalidatePath('/', 'layout');
  redirect(String(formData.get('next') || '/onboarding'));
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/sign-in');
}
