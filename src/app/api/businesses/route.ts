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
    let query = supabase
      .from('businesses_with_category')
      .select('*', { count: 'exact' })
      .eq('is_active', true); // Nur aktive Einträge

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

    // Sortierung: Featured zuerst, dann nach sort_order, dann alphabetisch
    query = query
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
