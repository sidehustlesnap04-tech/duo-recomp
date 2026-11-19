'use client';

import { useEffect, useState } from 'react';
import { savePushSubscription, removePushSubscription, sendTestNotification } from '@/lib/actions';

type State = 'checking' | 'unsupported' | 'needs-install' | 'off' | 'blocked' | 'on' | 'working';

const b64ToBytes = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

/**
 * A VAPID public key is an uncompressed P-256 point: 65 bytes starting 0x04.
 * Checking here turns a missing or mistyped environment variable into a
 * sentence someone can act on, instead of the browser's
 * "applicationServerKey must contain a valid P-256 public key".
 */
const keyProblem = (key: string): string | null => {
  if (!key) return 'The server did not supply a notification key. Check that VAPID_PUBLIC_KEY is set in Vercel and that you redeployed afterwards.';
  try {
    const bytes = b64ToBytes(key);
    if (bytes.length !== 65 || bytes[0] !== 4) {
      return `The notification key on the server is malformed: ${bytes.length} bytes, expected 65. Re-paste it, making sure no characters were trimmed.`;
    }
    return null;
  } catch {
    return 'The notification key on the server is not valid base64url. Re-paste it exactly as given.';
  }
};

export default function PushToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [state, setState] = useState<State>('checking');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const iosStandalone = (window.navigator as any).standalone === true;
      const installed = iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        // iOS only exposes PushManager once the app is on the Home Screen.
        setState(isIOS && !installed ? 'needs-install' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') return setState('blocked');

      const problem = keyProblem(vapidPublicKey);
      if (problem) {
        setNote(problem);
        setState('off');
        return;
      }

      const reg = await navigator.serviceWorker.getRegistration();
      const existing = await reg?.pushManager.getSubscription();
      setState(existing ? 'on' : 'off');
    })();
  }, []);

  async function enable() {
    const problem = keyProblem(vapidPublicKey);
    if (problem) {
      setNote(problem);
      setState('off');
      return;
    }
    setState('working');
    setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const wanted = b64ToBytes(vapidPublicKey);

      // A subscription is bound to the key it was created with. If the server
      // key has changed since — or an earlier attempt left one behind — reusing
      // it means every delivery is signed by a key the push service will not
      // accept, which surfaces as a 403 and nothing else. Replace it.
      let sub = await reg.pushManager.getSubscription();
      if (sub) {
        const existing = sub.options?.applicationServerKey;
        const same =
          existing &&
          new Uint8Array(existing).length === wanted.length &&
          new Uint8Array(existing).every((b, i) => b === wanted[i]);
        if (!same) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
          sub = null;
        }
      }

      sub =
        sub ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: wanted
        }));

      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        userAgent: navigator.userAgent
      });

      if (!res.ok) {
        setNote(res.error);
        setState('off');
        return;
      }
      setState('on');
    } catch (err: any) {
      setNote(err?.message ?? 'Could not turn notifications on.');
      setState('off');
    }
  }

  async function disable() {
    setState('working');
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setState('off');
  }

  async function test() {
    setNote(null);
    const res = await sendTestNotification();
    setNote(res.ok ? 'Sent. It should appear in a moment.' : res.error);
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      {state === 'checking' ? <p className="small muted">Checking this device…</p> : null}

      {state === 'needs-install' ? (
        <p className="small muted">
          iPhone only allows notifications once the app is on your Home Screen. Tap Share, then
          “Add to Home Screen”, open it from there, and this will switch on.
        </p>
      ) : null}

      {state === 'unsupported' ? (
        <p className="small muted">This browser does not support notifications.</p>
      ) : null}

      {state === 'blocked' ? (
        <p className="small muted">
          Notifications are blocked for this site. Turn them back on in your browser’s settings for
          this site, then reload.
        </p>
      ) : null}

      {state === 'off' || state === 'working' ? (
        <button className="btn player block" onClick={enable} disabled={state === 'working'}>
          {state === 'working' ? 'Just a moment…' : 'Turn on notifications'}
        </button>
      ) : null}

      {state === 'on' ? (
        <>
          <p className="small muted">On for this device.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={test}>Send a test</button>
            <button className="btn quiet" onClick={disable}>Turn off</button>
          </div>
        </>
      ) : null}

      {note ? <p className="tiny faint">{note}</p> : null}
    </div>
  );
}
