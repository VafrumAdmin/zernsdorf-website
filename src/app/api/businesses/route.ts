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
    // Erst Kategorien laden
    const { data: categories } = await supabase
      .from('business_categories')
      .select('id, name, display_name, icon, color');

    type Category = { id: string; name: string; display_name: string; icon: string; color: string };
    const categoryMap = new Map<string, Category>();
    (categories || []).forEach((c: Category) => categoryMap.set(c.id, c));

    // Dann Businesses ohne JOIN (Schema-Cache-Probleme)
    let query = supabase
      .from('businesses')
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

    // Sortierung
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform mit Kategorie-Daten
    const transformed = (data || []).map((b: Record<string, unknown>) => {
      const cat = categoryMap.get(b.category_id as string);
      return {
        ...b,
        category_name: cat?.name || null,
        category_display_name: cat?.display_name || null,
        category_icon: cat?.icon || null,
        category_color: cat?.color || null,
      };
    });

    return NextResponse.json({
      businesses: transformed,
      total: count || 0,
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
