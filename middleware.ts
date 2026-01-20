import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Die Wartungsmodus-Logik wird im (public) Route Group Layout gehandhabt
export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Setze den Pathname als Header für das Layout
  response.headers.set('x-pathname', request.nextUrl.pathname);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … if they contain a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
