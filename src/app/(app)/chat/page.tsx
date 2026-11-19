import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/duo';
import Chat, { type ChatMessage } from '@/components/Chat';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const { duo, members, me } = await requireSession();
  const supabase = createClient();

  // Newest 100, flipped back into reading order.
  const { data } = await supabase
    .from('messages')
    .select('id, user_id, body, reaction, created_at')
    .eq('duo_id', duo.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const initial = ((data ?? []) as ChatMessage[]).slice().reverse();
  const partner = members.find((m) => m.user_id !== me.user_id) ?? null;

  return (
    <Chat
      duoId={duo.id}
      me={{ user_id: me.user_id, display_name: me.display_name, mascot: me.mascot }}
      partner={partner ? { user_id: partner.user_id, display_name: partner.display_name, mascot: partner.mascot } : null}
      initial={initial}
    />
  );
}
