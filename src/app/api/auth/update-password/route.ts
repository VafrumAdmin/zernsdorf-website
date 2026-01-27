import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, updatePassword } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht angemeldet' },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen haben' },
        { status: 400 }
      );
    }

    const result = await updatePassword(user.id, password);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('Update password API error:', error);
    return NextResponse.json(
      { error: 'Passwort-Änderung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
