import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, paymentId } = body;

    const id = paymentId || transactionId;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Transaction / Payment ID manquant' }, { status: 400 });
    }

    const secretKey = process.env.MONEROO_SECRET_KEY || process.env.LEEKPAY_SECRET_KEY || '';

    // If server has a configured Secret Key, verify directly with API
    if (secretKey && secretKey.length > 10 && !secretKey.includes('Demo')) {
      try {
        const response = await fetch(`https://api.moneroo.io/v1/payments/${id}/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        const data = await response.json();
        const payment = data?.data;

        if (response.ok && payment) {
          const isSuccess = payment.status === 'success' || payment.status === 'completed';
          const isFailed = payment.status === 'failed' || payment.status === 'cancelled';

          return NextResponse.json({
            success: true,
            status: isSuccess ? 'PAID' : isFailed ? 'FAILED' : 'PENDING_PAYMENT',
            monerooStatus: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.created_at || null
          });
        }
      } catch (err: any) {
        console.error('[Payment Verify API Error]:', err);
        return NextResponse.json({ success: false, error: 'Échec de communication avec la passerelle' }, { status: 502 });
      }
    }

    // In production, reject unverified payments
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        status: 'UNVERIFIED',
        error: 'Passerelle de paiement en cours de configuration sur le serveur.'
      }, { status: 400 });
    }

    // Explicit Non-Production Sandbox Test Simulation Only
    return NextResponse.json({
      success: true,
      status: 'PAID',
      monerooStatus: 'sandbox_test_success',
      isSandboxTest: true,
      message: 'Mode bac à sable : transaction simulée en environnement de développement local'
    });

  } catch (error: any) {
    console.error('[Error verifying payment]:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Erreur de vérification' }, { status: 500 });
  }
}
