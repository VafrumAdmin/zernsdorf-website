import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// GET: Öffentliche API für Businesses (nur aktive Einträge)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Filter-Parameter
  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!isSupabaseConfigured()) {
    // Keine Datenbank konfiguriert - leeres Array zurückgeben
    return NextResponse.json({
      businesses: [],
      total: 0,
      source: 'none'
    });
  }

  const supabase = await createClient();

  try {
    // Erst versuchen mit sort_order, bei Fehler ohne
    let query = supabase
      .from('businesses_with_category')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Filter anwenden
    if (category) {
      query = query.eq('category_id', category);
    }
    if (location) {
      query = query.eq('location', location);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sortierung: alphabetisch (sort_order kann fehlen wenn Schema nicht aktuell)
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      // Fallback: Direkt aus businesses Tabelle
      const fallbackQuery = supabase
        .from('businesses')
        .select('*, business_categories(name, display_name, icon, color)', { count: 'exact' })
        .eq('is_active', true)
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      // Transform to match expected format
      const transformed = (fallbackData || []).map((b: Record<string, unknown>) => ({
        ...b,
        category_name: (b.business_categories as Record<string, unknown>)?.name || null,
        category_display_name: (b.business_categories as Record<string, unknown>)?.display_name || null,
        category_icon: (b.business_categories as Record<string, unknown>)?.icon || null,
        category_color: (b.business_categories as Record<string, unknown>)?.color || null,
      }));

      return NextResponse.json({
        businesses: transformed,
        total: fallbackCount || 0,
        source: 'database'
      });
    }

    return NextResponse.json({
      businesses: data || [],
      total: count || 0,
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
