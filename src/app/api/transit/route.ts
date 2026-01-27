import { NextResponse } from 'next/server';
import {
  ZERNSDORF_STOPS,
  findNearestStops,
  findNearestStopsByCoords,
  fetchMultiStopDepartures,
  fetchKWDepartures,
  type TransitStop,
} from '@/lib/transit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parameter
  const stopId = searchParams.get('stop'); // z.B. "bahnhof", "dorfaue", oder "kw"
  const address = searchParams.get('address'); // z.B. "Strandweg 5"
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const products = searchParams.get('products'); // z.B. "regional,bus" für KW

  try {
    // Spezialfall: Königs Wusterhausen
    if (stopId === 'kw') {
      const validProducts = ['regional', 'suburban', 'bus'] as const;
      type ProductType = typeof validProducts[number];
      const productFilter: ProductType[] = products
        ? products.split(',').filter((p): p is ProductType => validProducts.includes(p as ProductType))
        : ['regional', 'suburban', 'bus'];

      const departures = await fetchKWDepartures(productFilter, 60);

      return NextResponse.json({
        departures: departures.slice(0, limit),
        station: 'Königs Wusterhausen',
        stationId: '900260001',
        isLive: departures.length > 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    let stops: TransitStop[] = [];

    // Bestimme relevante Haltestellen
    if (stopId) {
      // Spezifische Haltestelle
      const stop = ZERNSDORF_STOPS.find(s => s.id === stopId || s.vbbId === stopId);
      if (stop) {
        stops = [stop];
      }
    } else if (address) {
      // Adress-basierte Suche
      stops = findNearestStops(address);
    } else if (lat && lng) {
      // Koordinaten-basierte Suche
      stops = findNearestStopsByCoords(parseFloat(lat), parseFloat(lng));
    } else {
      // Default: Bahnhof (Zug + Bus)
      stops = ZERNSDORF_STOPS.filter(s => s.id === 'bahnhof');
    }

    if (stops.length === 0) {
      // Fallback auf alle Haltestellen
      stops = ZERNSDORF_STOPS.slice(0, 3);
    }

    // Hole Abfahrten
    const { departures, isLive } = await fetchMultiStopDepartures(stops, limit);

    return NextResponse.json({
      departures,
      stops,
      allStops: ZERNSDORF_STOPS,
      isLive,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transit API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der ÖPNV-Daten' },
      { status: 500 }
    );
  }
}
