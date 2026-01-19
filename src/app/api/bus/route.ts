import { NextResponse } from 'next/server';
import {
  fetchLiveDepartures,
  getServiceAlerts,
  ZERNSDORF_STOPS,
  BUS_LINES,
  RB36_INFO,
} from '@/lib/bus';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stopId = searchParams.get('stop') || 'zernsdorf-dorfaue';
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  try {
    const { departures, isLive } = await fetchLiveDepartures(stopId, limit);
    const alerts = getServiceAlerts();

    return NextResponse.json({
      departures,
      alerts,
      stops: ZERNSDORF_STOPS,
      lines: BUS_LINES,
      rb36: RB36_INFO,
      isLive,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bus API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Bus-Daten' },
      { status: 500 }
    );
  }
}
