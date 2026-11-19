import 'server-only';
import * as webpush from 'web-push';
import { pushConfigured, vapidFor, subjectFor } from '@/lib/vapid';

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
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        payload,
        { vapidDetails: vapidFor(s.endpoint) }
      )
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  if (sent === 0) {
    const first = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    const reason = first?.reason;
    const code = reason?.statusCode;

    // The push service states the cause in its body; Apple returns
    // {"reason":"BadJwtToken"} and similar. Guessing at a bare status code
    // has cost several rounds, so surface what it actually said.
    let detail = '';
    try {
      const raw = typeof reason?.body === 'string' ? reason.body : JSON.stringify(reason?.body ?? '');
      if (raw && raw !== '""') detail = raw.slice(0, 180);
    } catch {
      /* body not readable */
    }
    const host = (() => {
      try {
        return new URL(subs[0].endpoint).host;
      } catch {
        return 'unknown';
      }
    })();

    // Say what to do, not just what happened.
    const explain =
      code === 403 || code === 401
        ? 'The push service rejected the signature. Turn notifications off and on again on this device — the subscription was made with an older key.'
        : code === 404 || code === 410
          ? 'This device’s subscription has expired. Turn notifications off and on again.'
          : code === 413
            ? 'The notification was too large.'
            : code
              ? `The push service refused it (${code}).`
              : 'The push service could not be reached.';

    return {
      ok: false as const,
      error: `${explain}${detail ? ` — service said: ${detail}` : ''} [${host}, sub=${subjectFor(subs[0].endpoint)}]`
    };
  }
  return { ok: true as const, sent };
}
