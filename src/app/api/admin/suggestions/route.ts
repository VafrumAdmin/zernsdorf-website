import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import type { BusinessSuggestionUpdate } from '@/types/database';

// GET: Get all suggestions (with optional status filter)
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
    // First fetch categories for enrichment
    const { data: categories } = await supabase
      .from('business_categories')
      .select('id, name, display_name, icon, color');

    type Category = { id: string; name: string; display_name: string; icon: string; color: string };
    const categoryMap = new Map<string, Category>();
    (categories || []).forEach((c: Category) => categoryMap.set(c.id, c));

    // Build query
    let query = supabase
      .from('business_suggestions')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: rawData, error, count } = await query;

    if (error) {
      console.error('Error fetching suggestions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with category data
    const suggestions = (rawData || []).map((s: Record<string, unknown>) => {
      const cat = categoryMap.get(s.category_id as string);
      return {
        ...s,
        category_name: cat?.name || null,
        category_display_name: cat?.display_name || null,
        category_icon: cat?.icon || null,
        category_color: cat?.color || null,
      };
    });

    return NextResponse.json({
      suggestions,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// PUT: Update a suggestion
export async function PUT(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Service Role nicht konfiguriert' }, { status: 503 });
  }

  try {
    const body: BusinessSuggestionUpdate & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = createAdminClient()!;

    // Remove id from update object
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('business_suggestions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating suggestion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, suggestion: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// DELETE: Delete a suggestion (also used for rejecting)
export async function DELETE(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Service Role nicht konfiguriert' }, { status: 503 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const supabase = createAdminClient()!;

    const { error } = await supabase
      .from('business_suggestions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting suggestion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
