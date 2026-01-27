import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// GET: Öffentliche API für Events (nur aktive, kommende Events)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const includePast = searchParams.get('includePast') === 'true';

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      events: [],
      total: 0
    });
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Nur zukünftige Events (außer includePast=true)
    if (!includePast) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('start_date', today);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Sortierung: Featured zuerst, dann nach Datum
    query = query
      .order('is_featured', { ascending: false })
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: data || [],
      total: count || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
