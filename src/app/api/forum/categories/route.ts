import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    // Fallback categories
    return NextResponse.json([
      { id: '1', name: 'general', display_name: 'Allgemeines', icon: 'message-circle', color: '#3B82F6', posts_count: 0 },
      { id: '2', name: 'neighborhood', display_name: 'Nachbarschaft', icon: 'home', color: '#10B981', posts_count: 0 },
      { id: '3', name: 'events', display_name: 'Veranstaltungen', icon: 'calendar', color: '#8B5CF6', posts_count: 0 },
      { id: '4', name: 'recommendations', display_name: 'Empfehlungen', icon: 'star', color: '#F59E0B', posts_count: 0 },
      { id: '5', name: 'questions', display_name: 'Fragen & Antworten', icon: 'help-circle', color: '#EC4899', posts_count: 0 },
      { id: '6', name: 'announcements', display_name: 'Ankündigungen', icon: 'megaphone', color: '#DC2626', posts_count: 0 },
    ]);
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
