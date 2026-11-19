'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Mascot from '@/components/Mascot';

export type ChatMessage = {
  id: string;
  user_id: string;
  body: string;
  reaction: string | null;
  created_at: string;
  pending?: boolean;
};

type Who = { user_id: string; display_name: string; mascot: string };

const REACTIONS = ['🔥', '💪', '😂', '❤️', '👀'];

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yest)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function Chat({
  duoId,
  me,
  partner,
  initial
}: {
  duoId: string;
  me: Who;
  partner: Who | null;
  initial: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [draft, setDraft] = useState('');
  const [openFor, setOpenFor] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // New rows arrive over the socket; the server already filtered by RLS, and
  // the filter here keeps another duo's traffic off this screen entirely.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${duoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `duo_id=eq.${duoId}` },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [...prev.filter((m) => !(m.pending && m.body === row.body)), row]
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `duo_id=eq.${duoId}` },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [duoId, supabase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft('');

    // Show it immediately; the socket echo replaces this row.
    const temp: ChatMessage = {
      id: `pending-${Date.now()}`,
      user_id: me.user_id,
      body,
      reaction: null,
      created_at: new Date().toISOString(),
      pending: true
    };
    setMessages((prev) => [...prev, temp]);

    const { error } = await supabase.from('messages').insert({ duo_id: duoId, user_id: me.user_id, body });
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setDraft(body);
    }
  }

  async function react(id: string, emoji: string) {
    setOpenFor(null);
    const current = messages.find((m) => m.id === id)?.reaction;
    const next = current === emoji ? null : emoji;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reaction: next } : m)));
    await supabase.from('messages').update({ reaction: next }).eq('id', id);
  }

  let lastDay = '';

  return (
    <div className="chat">
      <div className="chat-log">
        {messages.length === 0 ? (
          <p className="small muted" style={{ textAlign: 'center', padding: '32px 0' }}>
            {partner ? `Nothing here yet. Say something to ${partner.display_name}.` : 'Your partner has not joined yet.'}
          </p>
        ) : null}

        {messages.map((m) => {
          const mine = m.user_id === me.user_id;
          const who = mine ? me : partner;
          const stamp = dayLabel(m.created_at);
          const newDay = stamp !== lastDay;
          lastDay = stamp;

          return (
            <div key={m.id}>
              {newDay ? <div className="chat-day">{stamp}</div> : null}
              <div className={mine ? 'bubble-row mine' : 'bubble-row'}>
                {!mine && who ? (
                  <span className="bubble-face" aria-hidden>
                    <Mascot animal={who.mascot as 'fox' | 'rabbit'} pose="idle" size={34} />
                  </span>
                ) : null}

                <div style={{ minWidth: 0, maxWidth: '76%' }}>
                  <button
                    type="button"
                    className={mine ? 'bubble mine' : 'bubble'}
                    data-pending={m.pending ? 'true' : undefined}
                    onClick={() => setOpenFor(openFor === m.id ? null : m.id)}
                    aria-label={`Message from ${who?.display_name ?? 'partner'}. Tap to react.`}
                  >
                    {m.body}
                  </button>

                  <div className={mine ? 'bubble-meta mine' : 'bubble-meta'}>
                    {clock(m.created_at)}
                    {m.pending ? ' · sending' : ''}
                  </div>

                  {m.reaction ? (
                    <button type="button" className="reaction" onClick={() => react(m.id, m.reaction!)}>
                      {m.reaction}
                    </button>
                  ) : null}

                  {openFor === m.id ? (
                    <div className="react-bar">
                      {REACTIONS.map((emoji) => (
                        <button key={emoji} type="button" onClick={() => react(m.id, emoji)} aria-label={`React ${emoji}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={send}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={partner ? `Message ${partner.display_name}` : 'Waiting for your partner'}
          aria-label="Message"
          maxLength={2000}
          disabled={!partner}
        />
        <button className="btn player send" type="submit" disabled={!draft.trim() || !partner} aria-label="Send">
          ↑
        </button>
      </form>
    </div>
  );
}
