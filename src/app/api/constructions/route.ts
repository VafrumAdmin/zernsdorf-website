import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET: Alle sichtbaren Baustellen abrufen
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status'); // active, planned, completed
    const category = searchParams.get('category'); // Zernsdorf, KW, A10, etc.
    const includeAll = searchParams.get('all') === 'true'; // Für Admin

    let query = supabase
      .from('constructions')
      .select('*')
      .order('start_date', { ascending: true });

    // Filter nach Sichtbarkeit (außer Admin-Anfrage)
    if (!includeAll) {
      query = query.eq('is_visible', true);
    }

    // Filter nach Status
    if (status) {
      query = query.eq('status', status);
    } else if (!includeAll) {
      // Standardmäßig nur aktive und geplante zeigen
      query = query.in('status', ['active', 'planned']);
    }

    // Filter nach Kategorie
    if (category) {
      query = query.eq('category', category);
    }

    const { data: constructions, error } = await query;

    if (error) {
      console.error('Error fetching constructions:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Baustellen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      constructions: constructions || [],
      count: constructions?.length || 0,
    });
  } catch (error) {
    console.error('Constructions API error:', error);
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    );
  }
}

// POST: Neue Baustelle erstellen (Admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      title,
      description,
      location,
      type = 'road',
      category,
      start_date,
      end_date,
      status = 'planned',
      impact_level = 'medium',
      traffic_impact,
      detour_info,
      latitude,
      longitude,
      source,
      source_url,
      is_featured = false,
      is_visible = true,
    } = body;

    if (!title || !location || !start_date) {
      return NextResponse.json(
        { error: 'Titel, Ort und Startdatum sind erforderlich' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('constructions')
      .insert({
        title,
        description,
        location,
        type,
        category,
        start_date,
        end_date,
        status,
        impact_level,
        traffic_impact,
        detour_info,
        latitude,
        longitude,
        source,
        source_url,
        is_featured,
        is_visible,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating construction:', error);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Baustelle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ construction: data });
  } catch (error) {
    console.error('Create construction error:', error);
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    );
  }
}
