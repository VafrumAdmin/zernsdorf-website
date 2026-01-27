import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// GET: Liste alle Bulletin-Posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from('bulletin_posts')
      .select('*, bulletin_categories(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      const { data: cat } = await supabase
        .from('bulletin_categories')
        .select('id')
        .eq('name', category)
        .single();
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching bulletin posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neuen Bulletin-Post erstellen
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('bulletin_posts')
      .insert({
        category_id: body.category_id,
        author_name: body.author_name,
        author_email: body.author_email || null,
        author_phone: body.author_phone || null,
        title: body.title,
        content: body.content,
        is_lending: body.is_lending || false,
        lending_duration: body.lending_duration || null,
        location: body.location || 'Zernsdorf',
        show_contact: body.show_contact !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bulletin post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
