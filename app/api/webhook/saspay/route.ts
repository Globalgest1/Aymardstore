import { NextResponse } from 'next/server';
import { verifySaspayWebhookSignature } from '@/lib/saspay';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');
    const eventType = req.headers.get('x-webhook-event');

    const signingSecret = process.env.SASPAY_SIGNING_SECRET || '';

    // If signing secret is configured, verify HMAC signature
    if (signingSecret) {
      const isValid = verifySaspayWebhookSignature(rawBody, signature, timestamp, signingSecret);
      if (!isValid) {
        console.warn('[SasPay Webhook] Signature invalide ou horodatage expiré.');
        return NextResponse.json({ error: 'Signature invalide' }, { status: 403 });
      }
    }

    const payload = JSON.parse(rawBody);
    console.log(`[SasPay Webhook] Event reçu: ${eventType || payload.event}`, payload);

    const event = payload.event || eventType;
    const data = payload.data || {};

    if (event === 'transaction.success') {
      console.log(`[SasPay Webhook] Transaction confirmée: ${data.id} - Montant: ${data.amount} ${data.currency}`);
      // Transaction successful
    } else if (event === 'transaction.failed' || event === 'transaction.cancelled') {
      console.log(`[SasPay Webhook] Transaction échouée ou annulée: ${data.id}`);
    }

    return NextResponse.json({ received: true, status: 'acknowledged' });
  } catch (error: any) {
    console.error('[SasPay Webhook] Erreur traitement:', error);
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 });
  }
}
