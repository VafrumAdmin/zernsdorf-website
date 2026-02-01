import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/server';

interface HeartbeatRequest {
  visitor_id: string;
  session_id: string;
  page_path: string;
  scroll_depth?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: HeartbeatRequest = await request.json();
    const { visitor_id, session_id, page_path, scroll_depth } = body;

    // Validierung
    if (!visitor_id || !session_id) {
      return NextResponse.json(
        { error: 'visitor_id und session_id sind erforderlich' },
        { status: 400 }
      );
    }

    // Supabase nicht konfiguriert
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: true, demo: true });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: true, demo: true });
    }

    // Prüfe ob Session existiert
    const { data: existingSession } = await supabase
      .from('analytics_sessions')
      .select('id, session_start')
      .eq('id', session_id)
      .single();

    let currentSessionId = session_id;

    // Session existiert nicht - neue erstellen
    if (!existingSession) {
      const { data: newSession } = await supabase
        .from('analytics_sessions')
        .insert({
          visitor_id,
          is_returning: true, // Wenn wir einen Heartbeat kriegen, war der User schon da
        })
        .select('id')
        .single();

      if (newSession) {
        currentSessionId = newSession.id;
      }
    } else {
      // Session-Dauer aktualisieren
      const sessionStart = new Date(existingSession.session_start);
      const durationSeconds = Math.round((Date.now() - sessionStart.getTime()) / 1000);

      await supabase
        .from('analytics_sessions')
        .update({ duration_seconds: durationSeconds })
        .eq('id', session_id);
    }

    // Realtime-Eintrag aktualisieren
    await supabase
      .from('analytics_realtime')
      .upsert(
        {
          visitor_id,
          session_id: currentSessionId,
          current_page: page_path,
          last_activity: new Date().toISOString(),
        },
        { onConflict: 'visitor_id' }
      );

    // Scroll-Tiefe des letzten Pageviews aktualisieren (wenn höher)
    if (scroll_depth !== undefined && scroll_depth > 0) {
      // Hole aktuellen Scroll-Wert
      const { data: pageview } = await supabase
        .from('analytics_pageviews')
        .select('id, scroll_depth')
        .eq('session_id', currentSessionId)
        .eq('page_path', page_path)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pageview && scroll_depth > (pageview.scroll_depth || 0)) {
        await supabase
          .from('analytics_pageviews')
          .update({ scroll_depth })
          .eq('id', pageview.id);
      }
    }

    return NextResponse.json({
      success: true,
      session_id: currentSessionId !== session_id ? currentSessionId : undefined,
    });
  } catch (error) {
    console.error('Analytics heartbeat error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
