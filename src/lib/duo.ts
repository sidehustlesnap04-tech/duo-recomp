import { createClient } from '@/lib/supabase/server';

export type Member = {
  user_id: string;
  role: string;
  display_name: string;
  mascot: string;
};

/** The signed-in person, their duo, and both members. Null duo means onboarding. */
export async function loadSession() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { user: null, duo: null, members: [] as Member[], me: null as Member | null };

  const { data: membership } = await supabase
    .from('duo_members')
    .select('duo_id, role, duos(id, name, starts_on, length_days)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return { user, duo: null, members: [] as Member[], me: null as Member | null };

  const { data: rows } = await supabase
    .from('duo_members')
    .select('user_id, role, profiles(display_name, mascot)')
    .eq('duo_id', membership.duo_id);

  const members: Member[] = (rows ?? []).map((r: any) => ({
    user_id: r.user_id,
    role: r.role,
    display_name: r.profiles?.display_name ?? 'Player',
    mascot: r.profiles?.mascot ?? 'fox'
  }));

  return {
    user,
    duo: (membership as any).duos,
    members,
    me: members.find((m) => m.user_id === user.id) ?? null
  };
}
