import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort erforderlich' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error);
      return NextResponse.json({ error: 'Ungültige E-Mail oder Passwort' }, { status: 401 });
    }

    return NextResponse.json({
      user: data.user,
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
