import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const event = await req.json();
    console.log('[LeekPay Webhook] Event received:', JSON.stringify(event));

    // Handle payment.completed or transaction success
    return NextResponse.json({ received: true, status: 'success' });
  } catch (error: any) {
    console.error('[LeekPay Webhook] Error:', error);
    return NextResponse.json({ received: false, error: error.message }, { status: 400 });
  }
}
