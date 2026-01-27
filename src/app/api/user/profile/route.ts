import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Fields that are TIME type in the database
const TIME_FIELDS = ['work_arrival_time', 'waste_notification_time'];

// Fields that should never be updated directly
const PROTECTED_FIELDS = ['id', 'user_id', 'email', 'created_at', 'updated_at'];

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
    }

    const updates = await request.json();

    // Build safe updates object with proper type handling
    const safeUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      // Skip protected fields
      if (PROTECTED_FIELDS.includes(key)) {
        continue;
      }

      // Handle TIME fields - convert empty strings to null
      if (TIME_FIELDS.includes(key)) {
        safeUpdates[key] = value === '' || value === null || value === undefined ? null : value;
      }
      // Handle other string fields - convert empty strings to null
      else if (typeof value === 'string' && value === '') {
        safeUpdates[key] = null;
      }
      // Keep other values as-is
      else {
        safeUpdates[key] = value;
      }
    }

    // Update profile in database
    const { error } = await supabase
      .from('profiles')
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      console.error('Failed updates:', safeUpdates);
      return NextResponse.json({
        error: 'Profil konnte nicht aktualisiert werden',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Profil wurde aktualisiert' });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 });
  }
}
