export const ADMIN_COOKIE_NAME = 'aymard_admin_session';

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'aymard_republic_secure_secret_key_2026_fallback'
  );
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

async function getCryptoKey(): Promise<CryptoKey> {
  const secret = getSecretKey();
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Creates a cryptographically signed session token for the admin (Universal Web Crypto)
 */
export async function createAdminSessionToken(email: string): Promise<string> {
  const exp = Date.now() + SESSION_EXPIRY_MS;
  const payloadStr = JSON.stringify({ email, role: 'ADMIN', exp });
  const encoder = new TextEncoder();
  const payloadBase64 = base64UrlEncode(encoder.encode(payloadStr));

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadBase64)
  );

  const signatureBase64 = base64UrlEncode(signatureBuffer);
  return `${payloadBase64}.${signatureBase64}`;
}

/**
 * Verifies the validity and expiration of an admin session token (Universal Web Crypto)
 */
export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; email?: string }> {
  if (!token || typeof token !== 'string') return { valid: false };

  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };

  const [payloadBase64, signatureBase64] = parts;

  try {
    const key = await getCryptoKey();
    const encoder = new TextEncoder();
    
    // Decode signature
    const binarySig = base64UrlDecode(signatureBase64);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(payloadBase64)
    );

    if (!isValid) return { valid: false };

    const payloadJson = base64UrlDecode(payloadBase64);
    const data = JSON.parse(payloadJson);

    if (data.role !== 'ADMIN' || !data.exp || Date.now() > data.exp) {
      return { valid: false };
    }

    return { valid: true, email: data.email };
  } catch {
    return { valid: false };
  }
}
