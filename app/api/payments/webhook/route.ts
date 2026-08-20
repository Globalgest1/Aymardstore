import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-moneroo-signature') || req.headers.get('x-webhook-signature');
    
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'JSON payload invalide' }, { status: 400 });
    }

    const { event: eventName, data } = event || {};
    const status = data?.status;
    const paymentId = data?.id;
    const amount = data?.amount;
    const orderId = data?.metadata?.order_id || data?.description?.match(/#([A-Z0-9-]+)/)?.[1];

    // Check for success event or approved payment
    if (eventName === 'payment.success' || status === 'success' || status === 'completed') {
      console.log(`[Moneroo Webhook] Paiement validé pour la commande #${orderId || paymentId}: ${amount} ${data?.currency}`);

      return NextResponse.json({
        received: true,
        status: 'PAID',
        orderId,
        paymentId,
        amount
      });
    }

    if (eventName === 'payment.failed' || status === 'failed' || status === 'cancelled') {
      console.log(`[Moneroo Webhook] Paiement échoué ou annulé pour la transaction #${paymentId}`);
      return NextResponse.json({
        received: true,
        status: 'FAILED',
        reason: status || 'failed'
      });
    }

    return NextResponse.json({ received: true, status: 'IGNORED' });

  } catch (error: any) {
    console.error('Moneroo Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
