import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/server';
import type { EventSuggestionInsert } from '@/types/database';

// POST: Create a new event suggestion (public, no auth required)
export async function POST(request: NextRequest) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'Server nicht konfiguriert' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    // Honeypot spam protection - if this field is filled, it's a bot
    if (body.website_url_confirm && body.website_url_confirm.trim() !== '') {
      // Silently reject spam bots - pretend success
      return NextResponse.json(
        { success: true, message: 'Vielen Dank für Ihren Vorschlag!' },
        { status: 201 }
      );
    }

    // Basic validation
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
        { status: 400 }
      );
    }

    if (!body.start_date) {
      return NextResponse.json(
        { error: 'Startdatum ist erforderlich' },
        { status: 400 }
      );
    }

    // Validate title length
    if (body.title.trim().length < 3 || body.title.trim().length > 255) {
      return NextResponse.json(
        { error: 'Titel muss zwischen 3 und 255 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Basic email validation if provided
    if (body.submitted_by_email && body.submitted_by_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.submitted_by_email.trim())) {
        return NextResponse.json(
          { error: 'Ungültige E-Mail-Adresse' },
          { status: 400 }
        );
      }
    }

    // Rate limiting: Check if same email submitted in last 10 minutes
    const supabase = createAdminClient()!;

    if (body.submitted_by_email && body.submitted_by_email.trim()) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { count } = await supabase
        .from('event_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('submitted_by_email', body.submitted_by_email.trim().toLowerCase())
        .gte('created_at', tenMinutesAgo);

      if (count && count >= 3) {
        return NextResponse.json(
          { error: 'Zu viele Vorschläge in kurzer Zeit. Bitte warten Sie einige Minuten.' },
          { status: 429 }
        );
      }
    }

    // Prepare suggestion data
    const suggestionData: EventSuggestionInsert = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      event_type: body.event_type || 'single',
      category: body.category || 'community',

      start_date: body.start_date,
      start_time: body.start_time || null,
      end_date: body.end_date || null,
      end_time: body.end_time || null,
      is_all_day: body.is_all_day || false,

      is_recurring: body.is_recurring || false,
      recurrence_rule: body.recurrence_rule || null,
      recurrence_end_date: body.recurrence_end_date || null,

      location_name: body.location_name?.trim() || null,
      location_address: body.location_address?.trim() || null,
      location_business_id: body.location_business_id || null,

      organizer_name: body.organizer_name?.trim() || null,
      organizer_contact_email: body.organizer_contact_email?.trim() || null,
      organizer_contact_phone: body.organizer_contact_phone?.trim() || null,
      organizer_business_id: body.organizer_business_id || null,

      image_url: body.image_url?.trim() || null,
      images: body.images || null,

      website: body.website?.trim() || null,

      requires_registration: body.requires_registration || false,
      max_participants: body.max_participants || null,
      registration_url: body.registration_url?.trim() || null,

      status: 'pending',
      submitted_by_name: body.submitted_by_name?.trim() || null,
      submitted_by_email: body.submitted_by_email?.trim()?.toLowerCase() || null,
      submitted_by_phone: body.submitted_by_phone?.trim() || null,
    };

    // Insert suggestion
    const { data, error } = await supabase
      .from('event_suggestions')
      .insert(suggestionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating event suggestion:', error);
      return NextResponse.json(
        { error: 'Fehler beim Speichern des Vorschlags' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Vielen Dank für Ihren Vorschlag! Er wird von uns geprüft.',
        id: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in event-suggestions POST:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
