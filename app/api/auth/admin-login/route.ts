import { NextRequest, NextResponse } from 'next/server';
import { createAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Veuillez fournir un email et un mot de passe.' },
        { status: 400 }
      );
    }

    const officialAdminEmail = (process.env.ADMIN_EMAIL || 'judesinaberogui@gmail.com').toLowerCase().trim();
    const officialAdminPassword = process.env.ADMIN_PASSWORD || 'Mercredi12@';

    const normalizedInputEmail = email.toLowerCase().trim();

    // Verify credentials server-side
    if (normalizedInputEmail === officialAdminEmail && password === officialAdminPassword) {
      const token = await createAdminSessionToken(normalizedInputEmail);

      const response = NextResponse.json({
        success: true,
        user: {
          email: normalizedInputEmail,
          name: 'Judesinaberogui',
          role: 'ADMIN',
          phone: '+229 01 97 36 29 06',
        },
      });

      // Set hardened HttpOnly Session Cookie
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Identifiants administrateur invalides.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('[Admin Login Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la tentative de connexion administrateur.' },
      { status: 500 }
    );
  }
}
