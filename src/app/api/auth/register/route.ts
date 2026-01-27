import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zernsdorf.de'}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase auth error:', error);
      if (error.message.includes('already registered')) {
        return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      user: data.user,
      message: 'Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.',
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
