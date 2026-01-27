import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ message: 'Erfolgreich abgemeldet' });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Abmeldung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
