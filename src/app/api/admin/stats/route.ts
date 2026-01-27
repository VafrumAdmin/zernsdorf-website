import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';

// GET: Dashboard-Statistiken abrufen
export async function GET() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      stats: {
        businesses_count: 0,
        businesses_active: 0,
        events_upcoming: 0,
        traffic_alerts: 0,
        users_count: 0,
      }
    });
  }

  const supabase = await createClient();

  try {
    // Parallele Abfragen für bessere Performance
    const [
      businessesResult,
      activeBusinessesResult,
      upcomingEventsResult,
      trafficAlertsResult,
      usersResult
    ] = await Promise.all([
      // Alle Businesses
      supabase.from('businesses').select('id', { count: 'exact', head: true }),
      // Aktive Businesses
      supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      // Kommende Events
      supabase.from('events').select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString().split('T')[0]),
      // Traffic Alerts (Status != open)
      supabase.from('current_traffic_status').select('id', { count: 'exact', head: true })
        .neq('status', 'open'),
      // Benutzer
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      stats: {
        businesses_count: businessesResult.count || 0,
        businesses_active: activeBusinessesResult.count || 0,
        events_upcoming: upcomingEventsResult.count || 0,
        traffic_alerts: trafficAlertsResult.count || 0,
        users_count: usersResult.count || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
