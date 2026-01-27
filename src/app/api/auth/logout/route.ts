import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth/jwt';

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ message: 'Erfolgreich abgemeldet' });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Abmeldung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
