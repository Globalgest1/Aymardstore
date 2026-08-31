import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = 'XOF', description, customerEmail, customerName } = body;

    const apiKey = process.env.LEEKPAY_PUBLIC_KEY || process.env.NEXT_PUBLIC_LEEKPAY_PUBLIC_KEY || 'pk_live_O5SZdfU4qvpn651kMnmes9PWdo5eMxsd';

    const res = await fetch('https://leekpay.fr/api/public/widget/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.max(100, Math.round(amount)),
        currency: currency || 'XOF',
        key: apiKey,
        description: description || 'Commande AYMARD STORE',
        customer_email: customerEmail || null,
        customer_name: customerName || null
      })
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
