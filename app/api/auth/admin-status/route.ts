import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const verification = await verifyAdminSessionToken(token);

  if (verification.valid) {
    return NextResponse.json({
      authenticated: true,
      email: verification.email,
      role: 'ADMIN',
    });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
