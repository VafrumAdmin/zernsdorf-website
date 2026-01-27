import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    // Fallback categories
    return NextResponse.json([
      { id: '1', name: 'offer', display_name: 'Biete', icon: 'gift', color: '#10B981' },
      { id: '2', name: 'search', display_name: 'Suche', icon: 'search', color: '#3B82F6' },
      { id: '3', name: 'lend', display_name: 'Verleihe', icon: 'repeat', color: '#8B5CF6' },
      { id: '4', name: 'borrow', display_name: 'Suche zum Leihen', icon: 'hand', color: '#F59E0B' },
      { id: '5', name: 'help', display_name: 'Hilfe anbieten', icon: 'heart', color: '#EF4444' },
      { id: '6', name: 'help_needed', display_name: 'Hilfe gesucht', icon: 'life-buoy', color: '#EC4899' },
      { id: '7', name: 'lost', display_name: 'Verloren', icon: 'alert-circle', color: '#DC2626' },
      { id: '8', name: 'found', display_name: 'Gefunden', icon: 'check-circle', color: '#059669' },
    ]);
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('bulletin_categories')
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
