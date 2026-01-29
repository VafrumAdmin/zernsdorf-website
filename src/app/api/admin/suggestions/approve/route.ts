import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';

// POST: Approve a suggestion and copy to businesses table
export async function POST(request: NextRequest) {
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

    // First, fetch the suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('business_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching suggestion:', fetchError);
      return NextResponse.json({ error: 'Vorschlag nicht gefunden' }, { status: 404 });
    }

    if (suggestion.status === 'approved') {
      return NextResponse.json({ error: 'Vorschlag wurde bereits freigegeben' }, { status: 400 });
    }

    // Create business entry from suggestion
    const { data: business, error: insertError } = await supabase
      .from('businesses')
      .insert({
        name: suggestion.name,
        category_id: suggestion.category_id,
        description: suggestion.description,
        street: suggestion.street,
        house_number: suggestion.house_number,
        postal_code: suggestion.postal_code || '15712',
        city: suggestion.city || 'Zernsdorf',
        location: suggestion.location || 'Zernsdorf',
        phone: suggestion.phone,
        email: suggestion.email,
        website: suggestion.website,
        opening_hours: suggestion.opening_hours,
        opening_hours_text: suggestion.opening_hours_text,
        tags: suggestion.tags,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        is_active: true,
        is_verified: false,
        is_featured: false,
        is_recommended: false,
        sort_order: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating business:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Eintrags' }, { status: 500 });
    }

    // Update suggestion status to approved
    const { error: updateError } = await supabase
      .from('business_suggestions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating suggestion status:', updateError);
      // Business was created, but status update failed - log but don't fail
    }

    return NextResponse.json({
      success: true,
      message: 'Vorschlag wurde freigegeben und in das Verzeichnis übernommen.',
      business: business,
    });
  } catch (error) {
    console.error('Unexpected error in approve:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
