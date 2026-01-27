import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// GET: Liste alle veröffentlichten Faktenchecks
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verdict = searchParams.get('verdict');
  const category = searchParams.get('category');

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from('factchecks')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (verdict) {
      query = query.eq('verdict', verdict);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching factchecks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
