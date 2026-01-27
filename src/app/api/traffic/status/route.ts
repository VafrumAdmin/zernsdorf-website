import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { TrafficLocation, TrafficStatus } from '@/types/database';

// GET: Öffentliche API für Traffic Status (für Dashboard-Ampeln)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dashboardOnly = searchParams.get('dashboard') !== 'false';

  if (!isSupabaseConfigured()) {
    // Fallback: Standard-Status wenn keine DB
    return NextResponse.json({
      locations: [
        {
          id: '1',
          name: 'Tunnel Storkower Straße',
          name_short: 'Tunnel',
          status: 'open',
          status_level: 'green',
          message: null
        },
        {
          id: '2',
          name: 'Bahnübergang Zernsdorf',
          name_short: 'Bahnübergang',
          status: 'open',
          status_level: 'green',
          message: null
        },
        {
          id: '3',
          name: 'Segelfliegerdamm',
          name_short: 'Segelfliegerdamm',
          status: 'open',
          status_level: 'green',
          message: null
        },
      ],
      source: 'fallback'
    });
  }

  const supabase = await createClient();

  try {
    // Locations mit aktuellem Status abrufen
    let locationsQuery = supabase
      .from('traffic_locations')
      .select('*')
      .eq('is_active', true);

    if (dashboardOnly) {
      locationsQuery = locationsQuery.eq('show_on_dashboard', true);
    }

    locationsQuery = locationsQuery.order('sort_order', { ascending: true });

    const { data: locations, error: locationsError } = await locationsQuery;

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return NextResponse.json({ error: locationsError.message }, { status: 500 });
    }

    // Aktuellen Status für jede Location abrufen
    const { data: statusData, error: statusError } = await supabase
      .from('current_traffic_status')
      .select('*');

    if (statusError) {
      console.error('Error fetching status:', statusError);
    }

    // Kombiniere Locations mit ihrem Status
    const result = (locations || []).map((location: TrafficLocation) => {
      const status = statusData?.find((s: TrafficStatus) => s.location_id === location.id);
      return {
        id: location.id,
        name: location.name,
        name_short: location.name_short,
        location_type: location.location_type,
        status: status?.status || 'open',
        status_level: status?.status_level || 'green',
        message: status?.message || null,
        valid_until: status?.valid_until || null,
      };
    });

    return NextResponse.json({
      locations: result,
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
