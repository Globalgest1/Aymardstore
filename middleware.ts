import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Intercept Admin Portal and Admin APIs
  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(token);

    if (!session.valid) {
      // API call: return 401 Unauthorized JSON
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Accès non autorisé. Session administrateur requise.' },
          { status: 401 }
        );
      }

      // Web page: Redirect to /auth/login with return URL
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin',
    '/api/admin/:path*',
  ],
};
