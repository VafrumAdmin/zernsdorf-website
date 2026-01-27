import { NextRequest, NextResponse } from 'next/server';

const VBB_API_BASE = 'https://v6.vbb.transport.rest';

export interface JourneyLeg {
  origin: {
    name: string;
    id?: string;
    location?: { latitude: number; longitude: number };
  };
  destination: {
    name: string;
    id?: string;
    location?: { latitude: number; longitude: number };
  };
  departure: string;
  arrival: string;
  departurePlatform?: string;
  arrivalPlatform?: string;
  departureDelay?: number;
  arrivalDelay?: number;
  walking?: boolean;
  distance?: number;
  line?: {
    name: string;
    product: string;
    operator?: { name: string };
  };
  direction?: string;
  cancelled?: boolean;
  stopovers?: Array<{
    stop: { name: string; id: string };
    arrival: string | null;
    departure: string | null;
    arrivalDelay?: number;
    departureDelay?: number;
  }>;
}

export interface Journey {
  type: string;
  legs: JourneyLeg[];
  refreshToken?: string;
  price?: {
    amount: number;
    currency: string;
    hint?: string;
  };
}

export interface JourneysResponse {
  journeys: Journey[];
  earlierRef?: string;
  laterRef?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Required parameters
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing required parameters: from, to' },
      { status: 400 }
    );
  }

  // Build API URL
  const params = new URLSearchParams();

  // Handle from location
  const fromLat = searchParams.get('fromLat');
  const fromLng = searchParams.get('fromLng');
  const fromType = searchParams.get('fromType'); // 'stop' | 'address' | 'location'

  if (from.match(/^9\d{8}$/) || fromType === 'stop') {
    // VBB stop ID (starts with 9, 9 digits total)
    params.set('from', from);
  } else if (fromLat && fromLng) {
    // Address/location with coordinates
    params.set('from.latitude', fromLat);
    params.set('from.longitude', fromLng);
    params.set('from.address', searchParams.get('fromName') || from);
  } else if (from.includes(',') && from.split(',').length === 2) {
    // Coordinates: lat,lng format
    const [lat, lng] = from.split(',');
    if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      params.set('from.latitude', lat.trim());
      params.set('from.longitude', lng.trim());
      params.set('from.address', searchParams.get('fromName') || 'Startort');
    } else {
      // Not coordinates, treat as address text
      params.set('from.address', from);
    }
  } else {
    // Plain text address - try to use as address
    params.set('from.address', from);
  }

  // Handle to location
  const toLat = searchParams.get('toLat');
  const toLng = searchParams.get('toLng');
  const toType = searchParams.get('toType'); // 'stop' | 'address' | 'location'

  if (to.match(/^9\d{8}$/) || toType === 'stop') {
    // VBB stop ID
    params.set('to', to);
  } else if (toLat && toLng) {
    // Address/location with coordinates
    params.set('to.latitude', toLat);
    params.set('to.longitude', toLng);
    params.set('to.address', searchParams.get('toName') || to);
  } else if (to.includes(',') && to.split(',').length === 2) {
    // Coordinates: lat,lng format
    const [lat, lng] = to.split(',');
    if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      params.set('to.latitude', lat.trim());
      params.set('to.longitude', lng.trim());
      params.set('to.address', searchParams.get('toName') || 'Ziel');
    } else {
      params.set('to.address', to);
    }
  } else {
    params.set('to.address', to);
  }

  // Optional parameters
  const departure = searchParams.get('departure');
  const arrival = searchParams.get('arrival');
  if (departure) params.set('departure', departure);
  if (arrival) params.set('arrival', arrival);

  const results = searchParams.get('results') || '5';
  params.set('results', results);

  params.set('stopovers', 'true');
  params.set('remarks', 'true');
  params.set('language', 'de');
  params.set('pretty', 'false');

  // Transfer settings
  const transferTime = searchParams.get('transferTime');
  if (transferTime) params.set('transferTime', transferTime);

  // Walking speed (slow, normal, fast)
  const walkingSpeed = searchParams.get('walkingSpeed') || 'normal';
  params.set('walkingSpeed', walkingSpeed);

  // Product filters
  const suburban = searchParams.get('suburban') !== 'false';
  const subway = searchParams.get('subway') !== 'false';
  const tram = searchParams.get('tram') !== 'false';
  const bus = searchParams.get('bus') !== 'false';
  const ferry = searchParams.get('ferry') !== 'false';
  const express = searchParams.get('express') !== 'false';
  const regional = searchParams.get('regional') !== 'false';

  params.set('suburban', String(suburban));
  params.set('subway', String(subway));
  params.set('tram', String(tram));
  params.set('bus', String(bus));
  params.set('ferry', String(ferry));
  params.set('express', String(express));
  params.set('regional', String(regional));

  // Pagination
  const earlierThan = searchParams.get('earlierThan');
  const laterThan = searchParams.get('laterThan');
  if (earlierThan) params.set('earlierThan', earlierThan);
  if (laterThan) params.set('laterThan', laterThan);

  const url = `${VBB_API_BASE}/journeys?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      next: { revalidate: 60 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Journeys API] VBB error:', response.status, errorText);
      return NextResponse.json(
        { error: 'VBB API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log the raw response for debugging
    console.log('[Journeys API] Raw VBB response journeys:', data.journeys?.length);
    if (data.journeys?.[0]?.legs) {
      console.log('[Journeys API] First journey legs:', data.journeys[0].legs.map((l: { walking?: boolean; origin?: { name?: string; location?: { latitude?: number; longitude?: number } }; destination?: { name?: string; location?: { latitude?: number; longitude?: number } } }) => ({
        walking: l.walking,
        originName: l.origin?.name,
        originLat: l.origin?.location?.latitude,
        originLng: l.origin?.location?.longitude,
        destName: l.destination?.name,
        destLat: l.destination?.location?.latitude,
        destLng: l.destination?.location?.longitude,
      })));
    }

    // Get original from/to coordinates and names from request
    const fromName = searchParams.get('fromName') || searchParams.get('from') || 'Startort';
    const toName = searchParams.get('toName') || searchParams.get('to') || 'Ziel';

    // Process and simplify the response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const journeys = (data.journeys || []).map((j: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedLegs = j.legs.map((leg: any, idx: number, allLegs: any[]) => {
        const isFirstLeg = idx === 0;
        const isLastLeg = idx === allLegs.length - 1;

        // For first walking leg: use original from coordinates if missing
        let originLat = leg.origin?.location?.latitude;
        let originLng = leg.origin?.location?.longitude;
        let originName = leg.origin?.name || '';

        if (isFirstLeg && leg.walking && (!originLat || !originLng) && fromLat && fromLng) {
          originLat = parseFloat(fromLat);
          originLng = parseFloat(fromLng);
          originName = originName || fromName;
        }

        // For last walking leg: use original to coordinates if missing
        let destLat = leg.destination?.location?.latitude;
        let destLng = leg.destination?.location?.longitude;
        let destName = leg.destination?.name || '';

        if (isLastLeg && leg.walking && (!destLat || !destLng) && toLat && toLng) {
          destLat = parseFloat(toLat);
          destLng = parseFloat(toLng);
          destName = destName || toName;
        }

        return {
          origin: {
            name: originName,
            id: leg.origin?.id,
            latitude: originLat,
            longitude: originLng,
          },
          destination: {
            name: destName,
            id: leg.destination?.id,
            latitude: destLat,
            longitude: destLng,
          },
          // Use plannedDeparture/plannedArrival as the main time, or departure/arrival
          departure: leg.plannedDeparture || leg.departure,
          arrival: leg.plannedArrival || leg.arrival,
          departurePlatform: leg.departurePlatform || leg.plannedDeparturePlatform,
          arrivalPlatform: leg.arrivalPlatform || leg.plannedArrivalPlatform,
          departureDelay: leg.departureDelay || 0,
          arrivalDelay: leg.arrivalDelay || 0,
          walking: leg.walking || false,
          distance: leg.distance,
          line: leg.line ? {
            name: leg.line.name,
            product: leg.line.product,
            operator: leg.line.operator?.name,
          } : undefined,
          direction: leg.direction,
          cancelled: leg.cancelled || false,
          stopovers: leg.stopovers?.slice(0, 10), // Limit stopovers
        };
      });

      return {
        type: j.type,
        refreshToken: j.refreshToken,
        legs: processedLegs,
      };
    });

    return NextResponse.json({
      journeys,
      earlierRef: data.earlierRef,
      laterRef: data.laterRef,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    console.error('[Journeys API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
