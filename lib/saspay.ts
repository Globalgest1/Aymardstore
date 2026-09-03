import crypto from 'crypto';

// SasPay Official API Base URL
export const SASPAY_API_BASE = 'https://api.saspay.me/api/v1';

export interface SaspayCustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface SaspayCreateCheckoutParams {
  amount: number | string;
  currency?: string; // 'XOF', 'EUR', 'USD' (default 'XOF')
  description: string;
  country?: string; // 'BJ', 'CI', 'SN', etc. (default 'BJ')
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
  secretKey?: string;
}

export interface SaspayCheckoutResponse {
  id?: string;
  slug?: string;
  checkout_url?: string;
  status?: string;
  amount?: string;
  currency?: string;
  message?: string;
  data?: any;
  code?: number;
}

/**
 * Creates a hosted checkout session on SasPay (https://pay.saspay.me/checkout/...)
 */
export async function createSaspayCheckoutSession(
  params: SaspayCreateCheckoutParams
): Promise<SaspayCheckoutResponse> {
  const secretKey =
    params.secretKey ||
    process.env.SASPAY_SECRET_KEY ||
    '';

  if (!secretKey) {
    throw new Error('Clé API secrète SasPay non configurée (sk_test_... ou sk_live_...).');
  }

  const rawAmount = typeof params.amount === 'number' ? params.amount.toFixed(2) : params.amount;

  const payload = {
    amount: rawAmount,
    currency: params.currency || 'XOF',
    description: params.description || 'Commande AYMARD STORE',
    country: params.country || 'BJ',
    customer_email: params.customerEmail || 'client@aymardstore.com',
    customer_name: params.customerName || 'Client Aymard Store',
    customer_phone: params.customerPhone || '',
    return_url: params.returnUrl || '',
    metadata: params.metadata || {}
  };

  const res = await fetch(`${SASPAY_API_BASE}/checkout-sessions/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Erreur SasPay HTTP ${res.status}`;
    console.error('[SasPay] Erreur création session:', data);
    throw new Error(errorMsg);
  }

  return {
    ...data,
    id: data.id || data.data?.id,
    slug: data.slug || data.data?.slug,
    checkout_url: data.checkout_url || data.data?.checkout_url,
    status: data.status || data.data?.status
  };
}

/**
 * Verifies real transaction status directly with SasPay API
 */
export async function verifySaspayPayment(paymentId: string, secretKey?: string) {
  const key =
    secretKey ||
    process.env.SASPAY_SECRET_KEY ||
    '';

  if (!key) {
    throw new Error('Clé API secrète SasPay manquante pour la vérification.');
  }

  const res = await fetch(`${SASPAY_API_BASE}/payments/${paymentId}/verify/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${key}`
    }
  });

  return await res.json();
}

/**
 * Validates webhook HMAC-SHA256 signature according to SasPay specifications:
 * signature = hmac_sha256(signing_secret, `${timestamp}.${rawBody}`)
 */
export function verifySaspayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  signingSecret: string
): boolean {
  if (!signatureHeader || !timestampHeader || !signingSecret) {
    return false;
  }

  const TOLERANCE_SECONDS = 300; // 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const timestampNum = Number(timestampHeader);

  if (isNaN(timestampNum) || Math.abs(now - timestampNum) > TOLERANCE_SECONDS) {
    console.warn('[SasPay Webhook] Horodatage hors tolérance (diff > 5 min)');
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', signingSecret)
      .update(`${timestampHeader}.${rawBody}`)
      .digest('hex');

    const a = Buffer.from(signatureHeader.toLowerCase());
    const b = Buffer.from(expected.toLowerCase());

    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (err) {
    console.error('[SasPay Webhook] Erreur vérification signature:', err);
    return false;
  }
}
