import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort erforderlich' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen haben' },
        { status: 400 }
      );
    }

    const result = await registerUser(email, password, username);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      user: result.user,
      message: 'Erfolgreich registriert',
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
