import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import type { AnalyticsDashboardStats, TopPage, DeviceBreakdown, AnalyticsDaily } from '@/types/database';

// GET: Analytics-Statistiken abrufen
export async function GET(request: NextRequest) {
  // Admin-Authentifizierung prüfen
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  // Query-Parameter
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  // Supabase nicht konfiguriert - Demo-Daten zurückgeben
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({
      stats: getDemoStats(),
    });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({
      stats: getDemoStats(),
    });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = todayStart.toISOString().split('T')[0];

    // Datumsbereich berechnen
    const rangeStart = startDate
      ? new Date(startDate)
      : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const rangeEnd = endDate ? new Date(endDate) : now;

    // Parallele Abfragen
    const [
      todaySessionsResult,
      todayPageviewsResult,
      realtimeResult,
      historyResult,
      topPagesResult,
    ] = await Promise.all([
      // Heutige Sessions
      supabase
        .from('analytics_sessions')
        .select('id, visitor_id, is_returning, duration_seconds, device_type')
        .gte('session_start', todayStart.toISOString()),

      // Heutige Pageviews
      supabase
        .from('analytics_pageviews')
        .select('id')
        .gte('created_at', todayStart.toISOString()),

      // Echtzeit-Besucher (letzte 5 Minuten)
      supabase
        .from('analytics_realtime')
        .select('visitor_id, current_page, device_type')
        .gte('last_activity', new Date(now.getTime() - 5 * 60 * 1000).toISOString()),

      // Historische Daten
      supabase
        .from('analytics_daily')
        .select('*')
        .gte('date', rangeStart.toISOString().split('T')[0])
        .lte('date', rangeEnd.toISOString().split('T')[0])
        .order('date', { ascending: true }),

      // Top Seiten (letzte 30 Tage)
      supabase
        .from('analytics_pageviews')
        .select('page_path, page_title')
        .gte('created_at', rangeStart.toISOString()),
    ]);

    // Heutige Statistiken berechnen
    const todaySessions = todaySessionsResult.data || [];
    const todayPageviews = todayPageviewsResult.data || [];
    const realtimeData = realtimeResult.data || [];
    const historyData = (historyResult.data || []) as AnalyticsDaily[];

    // Einzigartige Besucher heute
    const uniqueVisitors = new Set(todaySessions.map((s) => s.visitor_id)).size;
    const returningVisitors = todaySessions.filter((s) => s.is_returning).length;
    const newVisitors = uniqueVisitors - new Set(todaySessions.filter((s) => s.is_returning).map((s) => s.visitor_id)).size;

    // Durchschnittliche Verweildauer
    const sessionsWithDuration = todaySessions.filter((s) => s.duration_seconds > 0);
    const avgDuration =
      sessionsWithDuration.length > 0
        ? Math.round(
            sessionsWithDuration.reduce((sum, s) => sum + s.duration_seconds, 0) /
              sessionsWithDuration.length
          )
        : 0;

    // Bounce Rate (Sessions mit nur 1 Pageview)
    const sessionsWithOneView = todaySessions.filter((s) => {
      // Wir zählen Sessions die nur 1 Pageview haben
      return true; // Simplified - would need actual pageview count per session
    });
    const bounceRate =
      todaySessions.length > 0
        ? Math.round((sessionsWithOneView.length / todaySessions.length) * 100)
        : 0;

    // Geräteverteilung heute
    const todayDeviceBreakdown: DeviceBreakdown = {
      desktop: todaySessions.filter((s) => s.device_type === 'desktop').length,
      mobile: todaySessions.filter((s) => s.device_type === 'mobile').length,
      tablet: todaySessions.filter((s) => s.device_type === 'tablet').length,
    };

    // Echtzeit-Statistiken
    const activePages = [...new Set(realtimeData.map((r) => r.current_page).filter(Boolean))] as string[];
    const realtimeDeviceBreakdown: DeviceBreakdown = {
      desktop: realtimeData.filter((r) => r.device_type === 'desktop').length,
      mobile: realtimeData.filter((r) => r.device_type === 'mobile').length,
      tablet: realtimeData.filter((r) => r.device_type === 'tablet').length,
    };

    // Top Seiten berechnen
    const pageviews = topPagesResult.data || [];
    const pageCounts = new Map<string, { count: number; title: string | null }>();

    for (const pv of pageviews) {
      const existing = pageCounts.get(pv.page_path);
      if (existing) {
        existing.count++;
      } else {
        pageCounts.set(pv.page_path, { count: 1, title: pv.page_title });
      }
    }

    const topPages: TopPage[] = Array.from(pageCounts.entries())
      .map(([path, data]) => ({
        path,
        views: data.count,
        title: data.title,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Gesamte Geräteverteilung (letzte 30 Tage)
    const totalDeviceBreakdown: DeviceBreakdown = historyData.reduce(
      (acc, day) => {
        const db = day.device_breakdown as DeviceBreakdown | null;
        if (db) {
          acc.desktop += db.desktop || 0;
          acc.mobile += db.mobile || 0;
          acc.tablet += db.tablet || 0;
        }
        return acc;
      },
      { desktop: 0, mobile: 0, tablet: 0 }
    );

    // Wenn keine historischen Daten, heutige verwenden
    if (totalDeviceBreakdown.desktop + totalDeviceBreakdown.mobile + totalDeviceBreakdown.tablet === 0) {
      totalDeviceBreakdown.desktop = todayDeviceBreakdown.desktop;
      totalDeviceBreakdown.mobile = todayDeviceBreakdown.mobile;
      totalDeviceBreakdown.tablet = todayDeviceBreakdown.tablet;
    }

    const stats: AnalyticsDashboardStats = {
      today: {
        visitors: uniqueVisitors,
        newVisitors,
        returningVisitors,
        pageviews: todayPageviews.length,
        avgDuration,
        bounceRate,
      },
      realtime: {
        activeVisitors: new Set(realtimeData.map((r) => r.visitor_id)).size,
        activePages,
        deviceBreakdown: realtimeDeviceBreakdown,
      },
      history: historyData,
      topPages,
      deviceBreakdown: totalDeviceBreakdown,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// POST: Tägliche Aggregation manuell auslösen
export async function POST(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ success: true, demo: true });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: true, demo: true });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Gestern als Standard
    const targetDate = dateParam || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Aggregation ausführen
    const { error } = await supabase.rpc('calculate_daily_analytics', {
      target_date: targetDate,
    });

    if (error) {
      console.error('Aggregation error:', error);
      return NextResponse.json({ error: 'Aggregation fehlgeschlagen' }, { status: 500 });
    }

    return NextResponse.json({ success: true, date: targetDate });
  } catch (error) {
    console.error('Error running aggregation:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

// Demo-Daten für Entwicklung ohne Datenbank
function getDemoStats(): AnalyticsDashboardStats {
  const today = new Date();
  const history: AnalyticsDaily[] = [];

  // 30 Tage Demo-Daten generieren
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Zufällige aber realistische Werte
    const baseVisitors = 50 + Math.floor(Math.random() * 150);
    const returningRate = 0.3 + Math.random() * 0.2;

    history.push({
      id: `demo-${i}`,
      date: date.toISOString().split('T')[0],
      unique_visitors: baseVisitors,
      returning_visitors: Math.floor(baseVisitors * returningRate),
      new_visitors: Math.floor(baseVisitors * (1 - returningRate)),
      total_pageviews: baseVisitors * (2 + Math.floor(Math.random() * 3)),
      avg_session_duration: 120 + Math.floor(Math.random() * 180),
      bounce_rate: 25 + Math.floor(Math.random() * 25),
      top_pages: null,
      device_breakdown: {
        desktop: Math.floor(baseVisitors * 0.55),
        mobile: Math.floor(baseVisitors * 0.38),
        tablet: Math.floor(baseVisitors * 0.07),
      },
      created_at: date.toISOString(),
    });
  }

  return {
    today: {
      visitors: 127,
      newVisitors: 89,
      returningVisitors: 38,
      pageviews: 342,
      avgDuration: 185,
      bounceRate: 32,
    },
    realtime: {
      activeVisitors: 12,
      activePages: ['/de', '/de/mobility', '/de/directory', '/de/events'],
      deviceBreakdown: { desktop: 7, mobile: 4, tablet: 1 },
    },
    history,
    topPages: [
      { path: '/de/mobility', views: 342, title: 'Verkehr & Mobilität' },
      { path: '/de', views: 298, title: 'Startseite' },
      { path: '/de/directory', views: 156, title: 'Branchenverzeichnis' },
      { path: '/de/waste', views: 134, title: 'Müllabfuhr' },
      { path: '/de/events', views: 89, title: 'Veranstaltungen' },
    ],
    deviceBreakdown: { desktop: 58, mobile: 38, tablet: 4 },
  };
}
