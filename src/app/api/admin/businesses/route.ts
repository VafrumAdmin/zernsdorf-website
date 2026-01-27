import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, isSupabaseConfigured, isServiceRoleConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import type { BusinessInsert, BusinessUpdate } from '@/types/database';

// GET: Alle Businesses abrufen (mit Filteroptionen)
export async function GET(request: NextRequest) {
  // Admin-Auth prüfen
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      error: 'Supabase nicht konfiguriert',
      businesses: [],
      total: 0
    });
  }

  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  // Filter-Parameter
  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const search = searchParams.get('search');
  const showInactive = searchParams.get('showInactive') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

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
      .select('*', { count: 'exact' });

    // Filter anwenden
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    if (category) {
      query = query.eq('category_id', category);
    }
    if (location) {
      query = query.eq('location', location);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sortierung und Pagination
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: rawData, error, count } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform mit Kategorie-Daten
    const data = (rawData || []).map((b: Record<string, unknown>) => {
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
      businesses: data || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neuen Business erstellen
export async function POST(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body: BusinessInsert = await request.json();

    // Validierung
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        name: body.name.trim(),
        category_id: body.category_id || null,
        description: body.description || null,
        description_en: body.description_en || null,
        street: body.street || null,
        house_number: body.house_number || null,
        postal_code: body.postal_code || '15712',
        city: body.city || 'Zernsdorf',
        location: body.location || 'Zernsdorf',
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        opening_hours: body.opening_hours || null,
        opening_hours_text: body.opening_hours_text || null,
        tags: body.tags || null,
        images: body.images || null,
        logo_url: body.logo_url || null,
        is_active: body.is_active ?? true,
        is_verified: body.is_verified ?? false,
        is_featured: body.is_featured ?? false,
        is_recommended: body.is_recommended ?? false,
        sort_order: body.sort_order ?? 0,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, business: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PUT: Business aktualisieren
export async function PUT(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body: BusinessUpdate & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();

    // Entferne id aus dem Update-Objekt
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('businesses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating business:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, business: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// DELETE: Business löschen
export async function DELETE(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    // Use admin client (with service role) to bypass RLS for delete operations
    const adminClient = createAdminClient();
    if (!adminClient) {
      // Fallback to regular client if service role not configured
      const supabase = await createClient();
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting business:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await adminClient
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting business:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
