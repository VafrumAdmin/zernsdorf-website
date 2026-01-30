import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 Sekunden Timeout

/**
 * API-Endpoint für automatische Baustellen-Abfrage
 * Wird von n8n Workflow aufgerufen
 *
 * POST /api/constructions/fetch
 * Body: {
 *   source: string,
 *   constructions: Array<{
 *     title: string,
 *     description?: string,
 *     location: string,
 *     type?: string,
 *     category?: string,
 *     start_date: string,
 *     end_date?: string,
 *     status?: string,
 *     impact_level?: string,
 *     traffic_impact?: string,
 *     source_url?: string,
 *     external_id?: string,
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // API Key prüfen
    const authHeader = request.headers.get('Authorization');
    const expectedKey = process.env.CONSTRUCTIONS_API_KEY || 'zernsdorf-constructions-2026';

    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { source, constructions } = body;

    if (!source || !constructions || !Array.isArray(constructions)) {
      return NextResponse.json(
        { error: 'source und constructions Array erforderlich' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const construction of constructions) {
      try {
        // Pflichtfelder prüfen
        if (!construction.title || !construction.location || !construction.start_date) {
          results.errors.push(`Fehlt: ${construction.title || 'Unbekannt'}`);
          results.skipped++;
          continue;
        }

        // Prüfen ob bereits vorhanden (via external_id oder title+location)
        let existingQuery = supabase
          .from('constructions')
          .select('id');

        if (construction.external_id) {
          existingQuery = existingQuery.eq('external_id', construction.external_id);
        } else {
          existingQuery = existingQuery
            .eq('title', construction.title)
            .eq('location', construction.location);
        }

        const { data: existing } = await existingQuery.single();

        const constructionData = {
          title: construction.title,
          description: construction.description || null,
          location: construction.location,
          type: construction.type || 'road',
          category: construction.category || null,
          start_date: construction.start_date,
          end_date: construction.end_date || null,
          status: construction.status || 'active',
          impact_level: construction.impact_level || 'medium',
          traffic_impact: construction.traffic_impact || null,
          detour_info: construction.detour_info || null,
          source: source,
          source_url: construction.source_url || null,
          external_id: construction.external_id || null,
          is_auto_fetched: true,
          last_fetched_at: new Date().toISOString(),
          is_visible: true,
        };

        if (existing) {
          // Update
          const { error } = await supabase
            .from('constructions')
            .update({
              ...constructionData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) throw error;
          results.updated++;
        } else {
          // Insert
          const { error } = await supabase
            .from('constructions')
            .insert(constructionData);

          if (error) throw error;
          results.added++;
        }
      } catch (err) {
        results.errors.push(`${construction.title}: ${err}`);
      }
    }

    // Source-Tabelle aktualisieren
    await supabase
      .from('construction_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        last_fetch_status: results.errors.length > 0 ? 'partial' : 'success',
        last_fetch_message: `Added: ${results.added}, Updated: ${results.updated}, Skipped: ${results.skipped}`,
      })
      .eq('name', source);

    return NextResponse.json({
      success: true,
      source,
      results,
    });
  } catch (error) {
    console.error('Constructions fetch error:', error);
    return NextResponse.json(
      { error: 'Serverfehler', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET: Liste der konfigurierten Quellen
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: sources, error } = await supabase
      .from('construction_sources')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ sources: sources || [] });
  } catch (error) {
    console.error('Get sources error:', error);
    return NextResponse.json(
      { error: 'Serverfehler' },
      { status: 500 }
    );
  }
}
