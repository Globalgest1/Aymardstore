import { NextResponse } from 'next/server';
import { createSaspayCheckoutSession } from '@/lib/saspay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amount,
      currency = 'XOF',
      description = 'Commande AYMARD STORE',
      country = 'BJ',
      customerEmail,
      customerName,
      customerPhone,
      returnUrl,
      metadata = {},
      secretKey
    } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Montant invalide pour la session SasPay.' },
        { status: 400 }
      );
    }

    const session = await createSaspayCheckoutSession({
      amount: Number(amount),
      currency: currency || 'XOF',
      description,
      country: country || 'BJ',
      customerEmail: customerEmail || 'client@aymardstore.com',
      customerName: customerName || 'Client Aymard Store',
      customerPhone: customerPhone || '',
      returnUrl: returnUrl || '',
      metadata,
      secretKey
    });

    const sessionData = session?.data || session;

    return NextResponse.json({
      success: true,
      id: sessionData.id,
      slug: sessionData.slug,
      checkout_url: sessionData.checkout_url,
      status: sessionData.status,
      data: sessionData
    });
  } catch (error: any) {
    console.error('[SasPay Checkout API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Erreur lors de la création de la session de paiement SasPay'
      },
      { status: 500 }
    );
  }
}
