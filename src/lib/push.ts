import 'server-only';
import * as webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

import { vapidFor, pushConfigured } from '@/lib/vapid';

export { pushConfigured };

export type PushNote = { title: string; body: string; url?: string; tag?: string };

/**
 * Sends a notification to the signed-in person's partner.
 *
 * Targets come from partner_push_targets(), which already applies the
 * partner's own category switch and quiet hours — this function does not get
 * to decide whether they want to be disturbed.
 *
 * Never throws: a failed notification must not fail the action that triggered
 * it. A message still sends even if the push does not.
 */
export async function notifyPartner(category: 'chat' | 'partner_activity', note: PushNote) {
  if (!pushConfigured()) return { sent: 0, configured: false };

  const supabase = createClient();
  const { data: targets, error } = await supabase.rpc('partner_push_targets', { category });
  if (error || !targets?.length) return { sent: 0, configured: true };

  const payload = JSON.stringify(note);

  const results = await Promise.allSettled(
    (targets as { endpoint: string; p256dh: string; auth_key: string }[]).map(async (t) => {
      try {
        await webpush.sendNotification(
          { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth_key } },
          payload,
          {
            TTL: 60 * 60 * 12,
            urgency: category === 'chat' ? 'high' : 'normal',
            vapidDetails: vapidFor(t.endpoint)
          }
        );
        return true;
      } catch (err: any) {
        // 404/410 mean the browser threw the subscription away for good.
        const gone = err?.statusCode === 404 || err?.statusCode === 410;
        await supabase.rpc('mark_push_failure', { target_endpoint: t.endpoint, gone });
        return false;
      }
    })
  );

  return {
    sent: results.filter((r) => r.status === 'fulfilled' && r.value).length,
    configured: true
  };
}
