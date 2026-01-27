import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';

// GET: Alle Kategorien abrufen
export async function GET() {
  // Kategorien sind öffentlich lesbar, aber wir prüfen Auth für Konsistenz
  if (!isSupabaseConfigured()) {
    // Fallback-Kategorien wenn DB nicht konfiguriert
    return NextResponse.json({
      categories: [
        { id: '1', name: 'gastronomy', display_name: 'Gastronomie', icon: 'utensils', color: '#F97316', sort_order: 1 },
        { id: '2', name: 'health', display_name: 'Gesundheit', icon: 'heart-pulse', color: '#EF4444', sort_order: 2 },
        { id: '3', name: 'retail', display_name: 'Gewerbe & Einkaufen', icon: 'shopping-bag', color: '#8B5CF6', sort_order: 3 },
        { id: '4', name: 'crafts', display_name: 'Handwerk', icon: 'wrench', color: '#F59E0B', sort_order: 4 },
        { id: '5', name: 'clubs', display_name: 'Vereine', icon: 'users', color: '#10B981', sort_order: 5 },
        { id: '6', name: 'leisure', display_name: 'Freizeit & Bildung', icon: 'graduation-cap', color: '#3B82F6', sort_order: 6 },
        { id: '7', name: 'services', display_name: 'Dienstleistungen', icon: 'briefcase', color: '#6366F1', sort_order: 7 },
        { id: '8', name: 'emergency', display_name: 'Notdienste', icon: 'siren', color: '#DC2626', sort_order: 8 },
      ]
    });
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('business_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neue Kategorie erstellen
export async function POST(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.name || !body.display_name) {
      return NextResponse.json({ error: 'Name und Anzeigename sind erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('business_categories')
      .insert({
        name: body.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: body.display_name,
        display_name_en: body.display_name_en || null,
        description: body.description || null,
        icon: body.icon || 'folder',
        color: body.color || '#6B7280',
        sort_order: body.sort_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PUT: Kategorie aktualisieren
export async function PUT(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('business_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
