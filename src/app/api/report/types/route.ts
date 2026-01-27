import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    // Fallback report types
    return NextResponse.json([
      { id: '1', name: 'litter', display_name: 'Müll / Abfall', icon: 'trash-2', color: '#F59E0B' },
      { id: '2', name: 'illegal_dump', display_name: 'Illegale Müllablagerung', icon: 'alert-triangle', color: '#DC2626' },
      { id: '3', name: 'graffiti', display_name: 'Graffiti / Schmiererei', icon: 'pen-tool', color: '#8B5CF6' },
      { id: '4', name: 'vandalism', display_name: 'Vandalismus', icon: 'alert-octagon', color: '#EF4444' },
      { id: '5', name: 'broken', display_name: 'Defekte Infrastruktur', icon: 'tool', color: '#6366F1' },
      { id: '6', name: 'green_area', display_name: 'Grünflächen-Problem', icon: 'trees', color: '#10B981' },
      { id: '7', name: 'street', display_name: 'Straßenschaden', icon: 'construction', color: '#F97316' },
      { id: '8', name: 'lighting', display_name: 'Beleuchtung defekt', icon: 'lightbulb-off', color: '#3B82F6' },
      { id: '9', name: 'other', display_name: 'Sonstiges', icon: 'more-horizontal', color: '#6B7280' },
    ]);
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('cleanliness_report_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching report types:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
