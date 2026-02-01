import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/server';
import type { BusinessSuggestionInsert } from '@/types/database';

// POST: Create a new business suggestion (public, no auth required)
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
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }

    // Validate name length
    if (body.name.trim().length < 2 || body.name.trim().length > 255) {
      return NextResponse.json(
        { error: 'Name muss zwischen 2 und 255 Zeichen lang sein' },
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
        .from('business_suggestions')
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
    const suggestionData: BusinessSuggestionInsert = {
      name: body.name.trim(),
      category_id: body.category_id || null,
      description: body.description?.trim() || null,
      street: body.street?.trim() || null,
      house_number: body.house_number?.trim() || null,
      postal_code: body.postal_code?.trim() || '15712',
      city: body.city?.trim() || 'Zernsdorf',
      location: body.location?.trim() || 'Zernsdorf',
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      website: body.website?.trim() || null,
      has_whatsapp: body.has_whatsapp || false,
      has_telegram: body.has_telegram || false,
      has_signal: body.has_signal || false,
      opening_hours: body.opening_hours || null,
      opening_hours_text: body.opening_hours_text?.trim() || null,
      tags: body.tags || null,
      logo_url: body.logo_url?.trim() || null,
      pending_images: body.pending_images || null,
      status: 'pending',
      submitted_by_name: body.submitted_by_name?.trim() || null,
      submitted_by_email: body.submitted_by_email?.trim()?.toLowerCase() || null,
      submitted_by_phone: body.submitted_by_phone?.trim() || null,
    };

    // Insert suggestion
    const { data, error } = await supabase
      .from('business_suggestions')
      .insert(suggestionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating suggestion:', error);
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
    console.error('Unexpected error in suggestions POST:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
