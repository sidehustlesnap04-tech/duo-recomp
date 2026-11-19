import { NextResponse } from 'next/server';
import { createECDH } from 'crypto';

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
/**
 * Derives the public point from the private scalar and compares it with the
 * configured public key. Two well-formed keys from different pairs look
 * perfectly healthy and produce a 403 from every push service, which is not
 * otherwise distinguishable from a dozen other causes. Returns a boolean;
 * no key material is derived into the response.
 */
const pairMatches = (pub: string, priv: string): boolean | null => {
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(Buffer.from(priv, 'base64url'));
    return ecdh.getPublicKey().equals(Buffer.from(pub, 'base64url'));
  } catch {
    return null;
  }
};

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
      pairMatches: pub && priv ? pairMatches(pub, priv) : null,
      ready: Boolean(pub) && pubBytes === 65 && Boolean(priv) && pairMatches(pub, priv) === true
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
