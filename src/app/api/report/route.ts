import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

// GET: Liste alle Sauberkeits-Meldungen
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reportType = searchParams.get('type');
  const status = searchParams.get('status');

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  try {
    let query = supabase
      .from('cleanliness_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Neue Meldung erstellen
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('cleanliness_reports')
      .insert({
        report_type: body.report_type,
        title: body.title,
        description: body.description,
        location_description: body.location_description,
        street: body.street || null,
        reporter_name: body.anonymous ? null : body.reporter_name || null,
        reporter_email: body.anonymous ? null : body.reporter_email || null,
        reporter_phone: body.anonymous ? null : body.reporter_phone || null,
        anonymous: body.anonymous || false,
        status: 'new',
        priority: 'normal',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
