import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import type { TrafficStatusInsert } from '@/types/database';

// GET: Traffic Locations und Status abrufen
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dashboardOnly = searchParams.get('dashboard') === 'true';

  if (!isSupabaseConfigured()) {
    // Fallback-Daten wenn DB nicht konfiguriert
    return NextResponse.json({
      locations: [
        { id: '1', name: 'Tunnel Storkower Straße', name_short: 'Tunnel', location_type: 'tunnel', sort_order: 1, show_on_dashboard: true },
        { id: '2', name: 'Bahnübergang Zernsdorf', name_short: 'Bahnübergang', location_type: 'crossing', sort_order: 2, show_on_dashboard: true },
        { id: '3', name: 'Segelfliegerdamm', name_short: 'Segelfliegerdamm', location_type: 'road', sort_order: 3, show_on_dashboard: true },
      ],
      status: []
    });
  }

  const supabase = await createClient();

  try {
    // Locations abrufen
    let locationsQuery = supabase
      .from('traffic_locations')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (dashboardOnly) {
      locationsQuery = locationsQuery.eq('show_on_dashboard', true);
    }

    const { data: locations, error: locationsError } = await locationsQuery;

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return NextResponse.json({ error: locationsError.message }, { status: 500 });
    }

    // Aktuellen Status für jede Location abrufen
    const { data: status, error: statusError } = await supabase
      .from('current_traffic_status')
      .select('*');

    if (statusError) {
      console.error('Error fetching status:', statusError);
      // Fahre fort ohne Status
    }

    return NextResponse.json({
      locations: locations || [],
      status: status || []
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neuen Traffic Status erstellen/aktualisieren
export async function POST(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body: TrafficStatusInsert = await request.json();

    if (!body.location_id) {
      return NextResponse.json({ error: 'Location ID ist erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();

    // Alten Status für diese Location als abgelaufen markieren
    await supabase
      .from('traffic_status')
      .update({ valid_until: new Date().toISOString() })
      .eq('location_id', body.location_id)
      .is('valid_until', null);

    // Neuen Status erstellen
    const { data, error } = await supabase
      .from('traffic_status')
      .insert({
        location_id: body.location_id,
        status: body.status || 'open',
        status_level: body.status_level || 'green',
        message: body.message || null,
        message_en: body.message_en || null,
        reason: body.reason || null,
        valid_from: body.valid_from || new Date().toISOString(),
        valid_until: body.valid_until || null,
        source: 'admin',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating traffic status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PUT: Traffic Location aktualisieren
export async function PUT(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, type, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();

    // Unterscheide zwischen Location und Status Update
    if (type === 'location') {
      const { data, error } = await supabase
        .from('traffic_locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, location: data });
    } else {
      const { data, error } = await supabase
        .from('traffic_status')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, status: data });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// DELETE: Traffic Status beenden
export async function DELETE(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const { id, location_id } = await request.json();

    const supabase = await createClient();

    if (id) {
      // Spezifischen Status beenden
      const { error } = await supabase
        .from('traffic_status')
        .update({ valid_until: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (location_id) {
      // Alle Status für eine Location beenden
      const { error } = await supabase
        .from('traffic_status')
        .update({ valid_until: new Date().toISOString() })
        .eq('location_id', location_id)
        .is('valid_until', null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
