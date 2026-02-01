import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';

// POST: Approve an event suggestion and create an event
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
      .from('event_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching event suggestion:', fetchError);
      return NextResponse.json({ error: 'Vorschlag nicht gefunden' }, { status: 404 });
    }

    if (suggestion.status === 'approved') {
      return NextResponse.json({ error: 'Vorschlag wurde bereits freigegeben' }, { status: 400 });
    }

    // Get business info if linked
    let locationName = suggestion.location_name;
    let locationAddress = suggestion.location_address;
    let organizerName = suggestion.organizer_name;
    let contactEmail = suggestion.organizer_contact_email || suggestion.contact_email;
    let contactPhone = suggestion.organizer_contact_phone || suggestion.contact_phone;

    // If location is linked to a business, get its info
    if (suggestion.location_business_id) {
      const { data: locationBusiness } = await supabase
        .from('businesses')
        .select('name, street, house_number, postal_code, city')
        .eq('id', suggestion.location_business_id)
        .single();

      if (locationBusiness) {
        locationName = locationName || locationBusiness.name;
        if (!locationAddress) {
          const parts = [
            locationBusiness.street,
            locationBusiness.house_number,
            locationBusiness.postal_code,
            locationBusiness.city,
          ].filter(Boolean);
          locationAddress = parts.join(' ');
        }
      }
    }

    // If organizer is linked to a business, get its info
    if (suggestion.organizer_business_id) {
      const { data: organizerBusiness } = await supabase
        .from('businesses')
        .select('name, phone, email, website')
        .eq('id', suggestion.organizer_business_id)
        .single();

      if (organizerBusiness) {
        organizerName = organizerName || organizerBusiness.name;
        contactEmail = contactEmail || organizerBusiness.email;
        contactPhone = contactPhone || organizerBusiness.phone;
      }
    }

    // Create event from suggestion
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        title: suggestion.title,
        description: suggestion.description,
        description_en: suggestion.description_en,

        start_date: suggestion.start_date,
        start_time: suggestion.start_time,
        end_date: suggestion.end_date,
        end_time: suggestion.end_time,
        is_all_day: suggestion.is_all_day || false,

        location_name: locationName,
        location_address: locationAddress,
        location_business_id: suggestion.location_business_id,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,

        category: suggestion.category || 'community',
        event_type: suggestion.event_type || 'single',

        organizer_name: organizerName,
        organizer_business_id: suggestion.organizer_business_id,

        contact_email: contactEmail,
        contact_phone: contactPhone,
        website: suggestion.website,

        image_url: suggestion.image_url,
        images: suggestion.images,

        is_active: true,
        is_featured: false,
        is_recurring: suggestion.is_recurring || false,
        recurrence_rule: suggestion.recurrence_rule,
        recurrence_end_date: suggestion.recurrence_end_date,

        requires_registration: suggestion.requires_registration || false,
        max_participants: suggestion.max_participants,
        registration_url: suggestion.registration_url,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating event:', insertError);
      return NextResponse.json({ error: 'Fehler beim Erstellen der Veranstaltung' }, { status: 500 });
    }

    // Update suggestion status to approved
    const { error: updateError } = await supabase
      .from('event_suggestions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating suggestion status:', updateError);
      // Event was created, but status update failed - log but don't fail
    }

    return NextResponse.json({
      success: true,
      message: 'Vorschlag wurde freigegeben und die Veranstaltung wurde erstellt.',
      event: event,
    });
  } catch (error) {
    console.error('Unexpected error in approve:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
