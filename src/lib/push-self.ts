import 'server-only';
import * as webpush from 'web-push';
import { pushConfigured } from '@/lib/push';

/**
 * Sends a notification to the caller's own devices. Separate from
 * notifyPartner because this one deliberately ignores categories and quiet
 * hours: it exists to prove the chain works, and it is only ever triggered
 * by the person tapping the button.
 */
export async function testSelf(subs: { endpoint: string; p256dh: string; auth_key: string }[]) {
  if (!pushConfigured()) {
    return { ok: false as const, error: 'Push keys are not configured on the server yet.' };
  }

  const payload = JSON.stringify({
    title: 'Duo Recomp',
    body: 'Notifications are working on this device.',
    url: '/today',
    tag: 'test'
  });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } }, payload)
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  if (sent === 0) {
    const first = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    const reason = first?.reason;
    return {
      ok: false as const,
      error: `The push service rejected it${reason?.statusCode ? ` (${reason.statusCode})` : ''}.`
    };
  }
  return { ok: true as const, sent };
}
