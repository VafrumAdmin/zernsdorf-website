import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD, SESSION_DURATION, ADMIN_SESSION_COOKIE } from '@/lib/admin/config';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      // Session-Token erstellen (einfacher Hash aus Timestamp + Password)
      const sessionToken = Buffer.from(
        `${Date.now()}-${ADMIN_PASSWORD}-${Math.random()}`
      ).toString('base64');

      // Cookie setzen
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_DURATION / 1000, // in Sekunden
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Falsches Passwort' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Fehler bei der Anmeldung' },
      { status: 500 }
    );
  }
}
