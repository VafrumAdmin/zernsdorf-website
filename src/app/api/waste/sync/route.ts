import { NextRequest, NextResponse } from 'next/server';
import { fetchSBAZVCalendar, invalidateCache, getCacheStatus } from '@/lib/waste/sbazv-fetcher';

// Dieser Endpoint wird vom Cron-Job aufgerufen
// Vercel Cron: https://vercel.com/docs/cron-jobs

/**
 * GET /api/waste/sync
 * Synchronisiert die Mülltermine mit dem SBAZV
 * Wird täglich um 6:00 Uhr aufgerufen
 *
 * Dieser Endpoint sollte durch einen CRON_SECRET geschützt sein
 */
export async function GET(request: NextRequest) {
  // Prüfe Authorization Header oder CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron Jobs senden automatisch Authorization Header
  // Für manuelle Aufrufe prüfe den CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Prüfe auch ob es ein Vercel Cron Job ist
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    if (!isVercelCron) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    console.log('[Waste Sync] Starting daily sync at', new Date().toISOString());

    // Cache invalidieren um frische Daten zu erzwingen
    invalidateCache();
    console.log('[Waste Sync] Cache invalidated');

    // Neue Daten vom SBAZV holen
    const result = await fetchSBAZVCalendar('');
    console.log('[Waste Sync] Fetch result:', {
      success: result.success,
      source: result.source,
      collectionCount: result.collections.length,
    });

    if (!result.success) {
      console.error('[Waste Sync] Sync failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        source: result.source,
        timestamp: new Date().toISOString(),
      });
    }

    const cacheStatus = getCacheStatus();

    console.log('[Waste Sync] Sync completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Mülltermine erfolgreich synchronisiert',
      source: result.source,
      collectionsLoaded: result.collections.length,
      timestamp: new Date().toISOString(),
      cacheStatus,
      nextSync: getNextSyncTime(),
    });
  } catch (error) {
    console.error('[Waste Sync] Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Sync fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/waste/sync
 * Manueller Sync (z.B. vom Admin-Panel)
 */
export async function POST(request: NextRequest) {
  // Prüfe Admin-Berechtigung
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;

  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const forceRefresh = body.forceRefresh === true;

    console.log('[Waste Sync] Manual sync triggered, forceRefresh:', forceRefresh);

    if (forceRefresh) {
      invalidateCache();
    }

    const result = await fetchSBAZVCalendar('');

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Sync erfolgreich' : 'Sync fehlgeschlagen',
      source: result.source,
      collectionsLoaded: result.collections.length,
      error: result.error,
      timestamp: new Date().toISOString(),
      cacheStatus: getCacheStatus(),
    });
  } catch (error) {
    console.error('[Waste Sync] Manual sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Manueller Sync fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getNextSyncTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0);
  return tomorrow.toISOString();
}
