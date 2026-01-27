import { NextRequest, NextResponse } from 'next/server';

// OpenRouteService API for walking directions (free tier: 2000 requests/day)
const ORS_API_BASE = 'https://api.openrouteservice.org/v2/directions/foot-walking';

export interface WalkingStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface WalkingDirectionsResponse {
  steps: WalkingStep[];
  totalDistance: number;
  totalDuration: number;
  polyline: string; // Encoded polyline for map
  coordinates: [number, number][]; // Array of [lng, lat] points
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const fromLat = searchParams.get('fromLat');
  const fromLng = searchParams.get('fromLng');
  const toLat = searchParams.get('toLat');
  const toLng = searchParams.get('toLng');

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json(
      { error: 'Missing coordinates' },
      { status: 400 }
    );
  }

  try {
    // Use OSRM (Open Source Routing Machine) - completely free, no API key needed
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(osrmUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('OSRM API error');
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: 'No route found' },
        { status: 404 }
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Extract steps with German instructions
    const steps: WalkingStep[] = leg.steps.map((step: {
      maneuver: { type: string; modifier?: string };
      name: string;
      distance: number;
      duration: number;
    }) => {
      let instruction = translateManeuver(step.maneuver.type, step.maneuver.modifier, step.name);

      return {
        instruction,
        distance: Math.round(step.distance),
        duration: Math.round(step.duration),
      };
    }).filter((step: WalkingStep) => step.distance > 5); // Filter out very short steps

    // Get coordinates for the route
    const coordinates: [number, number][] = route.geometry.coordinates;

    return NextResponse.json({
      steps,
      totalDistance: Math.round(route.distance),
      totalDuration: Math.round(route.duration),
      coordinates,
    });
  } catch (error) {
    console.error('[Walking Directions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get directions' },
      { status: 500 }
    );
  }
}

function translateManeuver(type: string, modifier: string | undefined, streetName: string): string {
  const street = streetName && streetName !== '' ? ` auf ${streetName}` : '';

  switch (type) {
    case 'depart':
      return `Starten Sie${street}`;
    case 'turn':
      switch (modifier) {
        case 'left':
          return `Links abbiegen${street}`;
        case 'right':
          return `Rechts abbiegen${street}`;
        case 'slight left':
          return `Leicht links halten${street}`;
        case 'slight right':
          return `Leicht rechts halten${street}`;
        case 'sharp left':
          return `Scharf links abbiegen${street}`;
        case 'sharp right':
          return `Scharf rechts abbiegen${street}`;
        case 'straight':
          return `Geradeaus weitergehen${street}`;
        case 'uturn':
          return `Wenden${street}`;
        default:
          return `Abbiegen${street}`;
      }
    case 'new name':
      return `Weiter${street}`;
    case 'continue':
      return `Geradeaus${street}`;
    case 'merge':
      return `Einordnen${street}`;
    case 'on ramp':
    case 'off ramp':
      return `Weiter${street}`;
    case 'fork':
      if (modifier === 'left') return `Links halten${street}`;
      if (modifier === 'right') return `Rechts halten${street}`;
      return `Weiter${street}`;
    case 'end of road':
      if (modifier === 'left') return `Am Ende links${street}`;
      if (modifier === 'right') return `Am Ende rechts${street}`;
      return `Am Ende der Straße${street}`;
    case 'arrive':
      return `Sie haben Ihr Ziel erreicht`;
    case 'roundabout':
      return `Im Kreisverkehr${street}`;
    case 'rotary':
      return `Im Kreisverkehr${street}`;
    default:
      return `Weiter${street}`;
  }
}
