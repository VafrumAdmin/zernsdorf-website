import { NextRequest, NextResponse } from 'next/server';

const VBB_API_BASE = 'https://v6.vbb.transport.rest';

export interface Location {
  type: 'stop' | 'location' | 'address';
  id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  products?: {
    suburban?: boolean;
    subway?: boolean;
    tram?: boolean;
    bus?: boolean;
    ferry?: boolean;
    express?: boolean;
    regional?: boolean;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query || query.length < 2) {
    return NextResponse.json({ locations: [] });
  }

  const params = new URLSearchParams({
    query,
    results: '10',
    stops: 'true',
    addresses: 'true',
    poi: 'true',
    language: 'de',
    pretty: 'false',
  });

  const url = `${VBB_API_BASE}/locations?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'VBB API error' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Simplify response
    const locations: Location[] = (data || []).map((loc: Record<string, unknown>) => ({
      type: loc.type === 'stop' ? 'stop' : loc.type === 'location' ? 'address' : 'location',
      id: loc.id as string | undefined,
      name: loc.name as string || loc.address as string || 'Unbekannt',
      latitude: loc.location ? (loc.location as { latitude: number }).latitude : (loc.latitude as number | undefined),
      longitude: loc.location ? (loc.location as { longitude: number }).longitude : (loc.longitude as number | undefined),
      products: loc.products as Location['products'],
    }));

    return NextResponse.json({ locations });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ locations: [] });
    }

    console.error('[Locations API] Error:', error);
    return NextResponse.json({ locations: [] });
  }
}
