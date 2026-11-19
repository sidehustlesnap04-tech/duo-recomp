import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const decodedLength = (key: string): number => {
  try {
    return Buffer.from(key, 'base64url').length;
  } catch {
    return -1;
  }
};

/**
 * Reports whether the push keys are configured and well-formed. Booleans and
 * byte counts only — no key material, not even a prefix. Exists so a failure
 * can be diagnosed without reading them out of the dashboard.
 */
export async function GET() {
  const pub = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const priv = process.env.VAPID_PRIVATE_KEY ?? '';
  const subject = process.env.VAPID_SUBJECT ?? '';

  const pubBytes = pub ? decodedLength(pub) : 0;

  return NextResponse.json(
    {
      publicKey: {
        present: Boolean(pub),
        readAs: process.env.VAPID_PUBLIC_KEY ? 'VAPID_PUBLIC_KEY' : pub ? 'NEXT_PUBLIC_VAPID_PUBLIC_KEY' : null,
        bytes: pubBytes,
        wellFormed: pubBytes === 65
      },
      privateKey: { present: Boolean(priv), bytes: priv ? decodedLength(priv) : 0 },
      subject: { present: Boolean(subject), isMailto: subject.startsWith('mailto:') },
      ready: Boolean(pub) && pubBytes === 65 && Boolean(priv)
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
