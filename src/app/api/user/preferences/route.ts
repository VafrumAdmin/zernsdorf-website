import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Benutzereinstellungen abrufen
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ preferences: null });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ preferences: null });
    }

    // Hole Profil mit allen Präferenz-Feldern
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        street,
        house_number,
        postal_code,
        city,
        work_street,
        work_house_number,
        work_postal_code,
        work_city,
        work_arrival_time,
        preferred_language,
        theme,
        store_data_locally,
        waste_street_id,
        waste_notifications,
        waste_notification_time,
        favorite_bus_stops
      `)
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 });
    }

    return NextResponse.json({
      preferences: profile || {},
      userId: user.id,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PUT: Benutzereinstellungen speichern
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const body = await request.json();

    // Erlaubte Felder für Update
    const allowedFields = [
      'street',
      'house_number',
      'postal_code',
      'city',
      'work_street',
      'work_house_number',
      'work_postal_code',
      'work_city',
      'work_arrival_time',
      'preferred_language',
      'theme',
      'store_data_locally',
      'waste_street_id',
      'waste_street_name',
      'waste_notifications',
      'waste_notification_time',
      'favorite_bus_stops',
      'nearest_stop_id',
      'nearest_stop_name',
      'nearest_stop_vbb_id',
    ];

    // Filter auf erlaubte Felder
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Felder zum Aktualisieren' }, { status: 400 });
    }

    // Update Profil
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PATCH: Einzelne Einstellung aktualisieren
export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { field, value } = await request.json();

    if (!field) {
      return NextResponse.json({ error: 'Feld ist erforderlich' }, { status: 400 });
    }

    // Erlaubte Felder
    const allowedFields = [
      'street', 'house_number', 'postal_code', 'city',
      'work_street', 'work_house_number', 'work_postal_code', 'work_city', 'work_arrival_time',
      'preferred_language', 'theme', 'store_data_locally',
      'waste_street_id', 'waste_street_name', 'waste_notifications', 'waste_notification_time',
      'favorite_bus_stops', 'nearest_stop_id', 'nearest_stop_name', 'nearest_stop_vbb_id',
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Ungültiges Feld' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating preference:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
