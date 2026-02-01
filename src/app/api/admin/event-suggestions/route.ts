import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import type { EventSuggestionUpdate } from '@/types/database';

// GET: Get all event suggestions (with optional status filter)
export async function GET(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      suggestions: [],
      total: 0,
    });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service Role nicht konfiguriert' }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', or null for all
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build query using the view that includes business info
    let query = supabase
      .from('event_suggestions_with_businesses')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      // If view doesn't exist yet, fall back to base table
      if (error.code === '42P01') {
        let fallbackQuery = supabase
          .from('event_suggestions')
          .select('*', { count: 'exact' });

        if (status) {
          fallbackQuery = fallbackQuery.eq('status', status);
        }

        fallbackQuery = fallbackQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;

        if (fallbackError) {
          console.error('Error fetching event suggestions:', fallbackError);
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }

        return NextResponse.json({
          suggestions: fallbackData || [],
          total: fallbackCount || 0,
          limit,
          offset,
        });
      }

      console.error('Error fetching event suggestions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      suggestions: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PUT: Update an event suggestion
export async function PUT(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Service Role nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body: EventSuggestionUpdate & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = createAdminClient()!;

    // Remove id from update object
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('event_suggestions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event suggestion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, suggestion: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// DELETE: Delete/reject an event suggestion
export async function DELETE(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Service Role nicht konfiguriert' }, { status: 503 });
  }

  try {
    const { id, reject } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = createAdminClient()!;

    if (reject) {
      // Mark as rejected instead of deleting
      const { error } = await supabase
        .from('event_suggestions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error rejecting event suggestion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Vorschlag wurde abgelehnt' });
    } else {
      // Permanently delete
      const { error } = await supabase
        .from('event_suggestions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event suggestion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Vorschlag wurde gelöscht' });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
