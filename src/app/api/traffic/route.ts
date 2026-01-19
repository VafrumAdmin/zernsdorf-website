import { NextResponse } from 'next/server';
import { fetchTrafficData } from '@/lib/traffic';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const trafficData = await fetchTrafficData(apiKey);

    return NextResponse.json(trafficData);
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Verkehrsdaten' },
      { status: 500 }
    );
  }
}
