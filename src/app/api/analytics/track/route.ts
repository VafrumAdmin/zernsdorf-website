import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/server';
import type { DeviceType } from '@/types/database';

interface TrackRequest {
  type: 'pageview' | 'session_start' | 'session_end';
  visitor_id: string;
  session_id?: string;
  page_path?: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
  device_type?: DeviceType;
  scroll_depth?: number;
  time_on_page?: number;
  is_returning?: boolean;
}

export async function POST(request: NextRequest) {
  // CORS-Headers für Beacon API
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Prüfe ob Body ein JSON ist (sendBeacon sendet als text/plain)
    const contentType = request.headers.get('content-type') || '';
    let body: TrackRequest;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Beacon API sendet als text/plain
      const text = await request.text();
      body = JSON.parse(text);
    }

    const {
      type,
      visitor_id,
      session_id,
      page_path,
      page_title,
      referrer,
      user_agent,
      device_type,
      scroll_depth,
      time_on_page,
      is_returning,
    } = body;

    // Validierung
    if (!visitor_id || !type) {
      return NextResponse.json(
        { error: 'visitor_id und type sind erforderlich' },
        { status: 400, headers }
      );
    }

    // Supabase nicht konfiguriert - still zurückgeben
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: true, demo: true }, { headers });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: true, demo: true }, { headers });
    }

    switch (type) {
      case 'session_start': {
        // Prüfe ob Besucher wiederkehrend ist
        const { count } = await supabase
          .from('analytics_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('visitor_id', visitor_id);

        const isReturning = is_returning ?? (count !== null && count > 0);

        // Neue Session erstellen
        const { data: session, error: sessionError } = await supabase
          .from('analytics_sessions')
          .insert({
            visitor_id,
            referrer,
            user_agent,
            device_type,
            is_returning: isReturning,
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('Session creation error:', sessionError);
          return NextResponse.json({ error: 'Session konnte nicht erstellt werden' }, { status: 500, headers });
        }

        // Realtime-Eintrag erstellen
        await supabase
          .from('analytics_realtime')
          .upsert(
            {
              visitor_id,
              session_id: session.id,
              current_page: page_path,
              device_type,
              last_activity: new Date().toISOString(),
            },
            { onConflict: 'visitor_id' }
          );

        return NextResponse.json({ success: true, session_id: session.id }, { headers });
      }

      case 'pageview': {
        // Pageview erstellen
        const { error: pageviewError } = await supabase
          .from('analytics_pageviews')
          .insert({
            session_id: session_id || null,
            visitor_id,
            page_path: page_path || '/',
            page_title,
            time_on_page: time_on_page || 0,
            scroll_depth: scroll_depth || 0,
          });

        if (pageviewError) {
          console.error('Pageview error:', pageviewError);
        }

        // Session Pageviews erhöhen
        if (session_id) {
          // Direkte Erhöhung über SQL-Ausdruck ist nicht möglich mit Supabase Client
          // Daher holen wir den aktuellen Wert und erhöhen ihn
          const { data: currentSession } = await supabase
            .from('analytics_sessions')
            .select('page_views')
            .eq('id', session_id)
            .single();

          if (currentSession) {
            await supabase
              .from('analytics_sessions')
              .update({ page_views: (currentSession.page_views || 0) + 1 })
              .eq('id', session_id);
          }
        }

        // Realtime aktualisieren
        await supabase
          .from('analytics_realtime')
          .upsert(
            {
              visitor_id,
              session_id: session_id || null,
              current_page: page_path,
              device_type,
              last_activity: new Date().toISOString(),
            },
            { onConflict: 'visitor_id' }
          );

        return NextResponse.json({ success: true }, { headers });
      }

      case 'session_end': {
        if (session_id) {
          // Session-Ende berechnen
          const { data: session } = await supabase
            .from('analytics_sessions')
            .select('session_start')
            .eq('id', session_id)
            .single();

          if (session) {
            const sessionStart = new Date(session.session_start);
            const durationSeconds = Math.round((Date.now() - sessionStart.getTime()) / 1000);

            await supabase
              .from('analytics_sessions')
              .update({
                session_end: new Date().toISOString(),
                duration_seconds: durationSeconds,
              })
              .eq('id', session_id);
          }

          // Letzten Pageview mit Zeit aktualisieren
          if (time_on_page && page_path) {
            await supabase
              .from('analytics_pageviews')
              .update({
                time_on_page,
                scroll_depth: scroll_depth || 0,
              })
              .eq('session_id', session_id)
              .eq('page_path', page_path)
              .order('created_at', { ascending: false })
              .limit(1);
          }
        }

        // Realtime-Eintrag entfernen
        await supabase
          .from('analytics_realtime')
          .delete()
          .eq('visitor_id', visitor_id);

        return NextResponse.json({ success: true }, { headers });
      }

      default:
        return NextResponse.json({ error: 'Unbekannter Event-Typ' }, { status: 400, headers });
    }
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500, headers });
  }
}

// OPTIONS für CORS Preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
