import 'server-only';

export const VAPID_PUBLIC =
  process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
export const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';

/** The deployment's own origin, used as an https VAPID subject. */
export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (configured.startsWith('https://')) return configured.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? '';
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return 'https://duo-recomp.vercel.app';
}

/**
 * The VAPID `sub` claim, chosen per push service.
 *
 * The spec allows either a mailto: or an https: URI, and most services accept
 * both. Apple returns BadJwtToken for a well-formed token with a mailto
 * subject often enough that it is not worth fighting: Apple gets the site's
 * own https origin, everyone else gets the configured contact address.
 */
export function subjectFor(endpoint: string): string {
  const configured = process.env.VAPID_SUBJECT ?? '';
  const isApple = endpoint.includes('push.apple.com');

  if (isApple) return configured.startsWith('https://') ? configured : siteOrigin();
  return configured || siteOrigin();
}

export const vapidFor = (endpoint: string) => ({
  subject: subjectFor(endpoint),
  publicKey: VAPID_PUBLIC,
  privateKey: VAPID_PRIVATE
});

export const pushConfigured = () => Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
