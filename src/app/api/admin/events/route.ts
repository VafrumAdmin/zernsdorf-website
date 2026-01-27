import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import type { EventInsert, EventUpdate } from '@/types/database';

// GET: Alle Events abrufen
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const upcoming = searchParams.get('upcoming') === 'true';
  const category = searchParams.get('category');
  const showInactive = searchParams.get('showInactive') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

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
      .select('*', { count: 'exact' });

    // Filter
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    if (upcoming) {
      query = query.gte('start_date', new Date().toISOString().split('T')[0]);
    }
    if (category) {
      query = query.eq('category', category);
    }

    // Sortierung und Pagination
    query = query
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
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neues Event erstellen
export async function POST(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body: EventInsert = await request.json();

    // Validierung
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Titel ist erforderlich' }, { status: 400 });
    }
    if (!body.start_date) {
      return NextResponse.json({ error: 'Startdatum ist erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: body.title.trim(),
        description: body.description || null,
        description_en: body.description_en || null,
        start_date: body.start_date,
        start_time: body.start_time || null,
        end_date: body.end_date || null,
        end_time: body.end_time || null,
        is_all_day: body.is_all_day ?? false,
        location_name: body.location_name || null,
        location_address: body.location_address || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        category: body.category || 'general',
        organizer_name: body.organizer_name || null,
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        website: body.website || null,
        image_url: body.image_url || null,
        images: body.images || null,
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        is_recurring: body.is_recurring ?? false,
        recurrence_rule: body.recurrence_rule || null,
        requires_registration: body.requires_registration ?? false,
        max_participants: body.max_participants || null,
        registration_url: body.registration_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PUT: Event aktualisieren
export async function PUT(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body: EventUpdate & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = await createClient();
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// DELETE: Event löschen
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
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await adminClient
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
