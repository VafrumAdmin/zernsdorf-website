import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// GET: Liste alle Forum-Posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from('forum_posts')
      .select('*, forum_categories(*)')
      .eq('is_active', true)
      .eq('is_approved', true)
      .is('parent_id', null) // Only top-level posts
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) {
      const { data: cat } = await supabase
        .from('forum_categories')
        .select('id')
        .eq('name', category)
        .single();
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching forum posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neuen Forum-Post erstellen
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        category_id: body.category_id,
        author_name: body.author_name,
        title: body.title,
        content: body.content,
        parent_id: body.parent_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating forum post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
