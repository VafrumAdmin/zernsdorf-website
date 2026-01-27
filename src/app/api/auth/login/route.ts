import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort erforderlich' },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      user: result.user,
      message: 'Erfolgreich angemeldet',
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Anmeldung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
