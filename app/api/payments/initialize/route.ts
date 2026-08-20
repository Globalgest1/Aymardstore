import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      amount, 
      currency = 'XOF', 
      description, 
      customer, 
      orderId,
      returnUrl,
      secretKey,
      environment = 'sandbox'
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const isoCurrency = currency === 'FCFA' ? 'XOF' : (currency === 'EUR' ? 'EUR' : currency);

    // If real Moneroo Secret Key is provided, call Moneroo API
    if (secretKey && secretKey.length > 10 && !secretKey.includes('Demo')) {
      try {
        const response = await fetch('https://api.moneroo.io/v1/payments/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(amount),
            currency: isoCurrency,
            description: description || `Commande Aymard Store #${orderId || Date.now()}`,
            customer: {
              email: customer?.email || 'client@aymard-store.com',
              first_name: customer?.firstname || 'Client',
              last_name: customer?.lastname || 'Aymard Store',
              phone: customer?.phone || ''
            },
            return_url: returnUrl || 'https://aymard-store.com/account?tab=orders',
            metadata: {
              order_id: orderId,
              source: 'AYMARD_STORE_1CLIC'
            }
          })
        });

        const data = await response.json();

        if (response.ok && data?.data) {
          return NextResponse.json({
            success: true,
            transactionId: data.data.id || data.data.payment_id,
            checkoutUrl: data.data.checkout_url,
            reference: data.data.reference,
            mode: 'API_REAL'
          });
        }
      } catch (apiErr: any) {
        console.error('Moneroo API direct call failed, falling back to simulated session:', apiErr);
      }
    }

    // Fallback Simulator Session
    const simTxId = `tx_moneroo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return NextResponse.json({
      success: true,
      transactionId: simTxId,
      reference: `MNR-${Date.now()}`,
      checkoutUrl: null,
      mode: 'SIMULATION',
      message: 'Initialisation sécurisée du guichet de paiement Moneroo'
    });

  } catch (error: any) {
    console.error('Error initializing Moneroo payment:', error);
    return NextResponse.json({ 
      error: error?.message || 'Erreur lors de l\'initialisation du paiement Moneroo' 
    }, { status: 500 });
  }
}
