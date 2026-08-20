import { NextResponse } from 'next/server';
import { checkOtp } from '@/lib/otp-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email et code requis' },
        { status: 400 }
      );
    }

    const verification = checkOtp(email, code);

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.message || 'Code incorrect' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code vérifié avec succès'
    });
  } catch (error: any) {
    console.error('Erreur API verify-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification du code' },
      { status: 500 }
    );
  }
}
