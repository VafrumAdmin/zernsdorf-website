import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// GET: Liste alle Haustier-Alerts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const alertType = searchParams.get('type');
  const petType = searchParams.get('pet');

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from('pet_alerts')
      .select('*')
      .neq('status', 'expired')
      .order('is_urgent', { ascending: false })
      .order('created_at', { ascending: false });

    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    if (petType) {
      query = query.eq('pet_type', petType);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching pet alerts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neuen Pet-Alert erstellen
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('pet_alerts')
      .insert({
        alert_type: body.alert_type,
        pet_type: body.pet_type,
        pet_name: body.pet_name || null,
        pet_breed: body.pet_breed || null,
        pet_color: body.pet_color || null,
        pet_size: body.pet_size || null,
        pet_distinctive_features: body.pet_distinctive_features || null,
        description: body.description,
        last_seen_location: body.last_seen_location || null,
        last_seen_date: body.last_seen_date || null,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        is_urgent: body.is_urgent || false,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pet alert:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
