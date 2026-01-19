// Verkehrslage für Zernsdorf und Umgebung
// Verwendet Google Routes API für Echtzeit-Verkehrsdaten

// Koordinaten für relevante Routen
const ROUTES = [
  {
    id: 'l30_kw',
    name: 'L30 → Königs Wusterhausen',
    origin: { lat: 52.2847, lng: 13.6083 }, // Zernsdorf Zentrum
    destination: { lat: 52.2967, lng: 13.6336 }, // KW Bahnhof
  },
  {
    id: 'l30_kablow',
    name: 'L30 → Kablow',
    origin: { lat: 52.2847, lng: 13.6083 }, // Zernsdorf Zentrum
    destination: { lat: 52.2650, lng: 13.5850 }, // Kablow
  },
  {
    id: 'a10',
    name: 'A10 (Schönefelder Kreuz)',
    origin: { lat: 52.2967, lng: 13.6336 }, // KW
    destination: { lat: 52.3400, lng: 13.5200 }, // Schönefelder Kreuz
  },
];

export type TrafficLevel = 'frei' | 'leicht' | 'stockend' | 'stau';

export interface TrafficSegment {
  id: string;
  name: string;
  level: TrafficLevel;
  speed: number; // km/h
  freeFlowSpeed: number; // km/h
  delay: number; // seconds
  distance: number; // km
  duration: number; // seconds (actual)
  durationInTraffic: number; // seconds (with traffic)
}

export interface TrafficData {
  segments: TrafficSegment[];
  overallLevel: TrafficLevel;
  lastUpdated: Date;
  isLive: boolean;
}

/**
 * Bestimmt das Verkehrslevel basierend auf Verzögerung
 */
function getTrafficLevel(delay: number, duration: number): TrafficLevel {
  const delayRatio = delay / duration;
  if (delayRatio < 0.1) return 'frei';
  if (delayRatio < 0.25) return 'leicht';
  if (delayRatio < 0.5) return 'stockend';
  return 'stau';
}

/**
 * Holt Verkehrsdaten von Google Routes API
 */
export async function fetchGoogleTraffic(apiKey: string): Promise<TrafficSegment[]> {
  const segments: TrafficSegment[] = [];

  for (const route of ROUTES) {
    try {
      const response = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters,routes.travelAdvisory',
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: route.origin.lat,
                  longitude: route.origin.lng,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: route.destination.lat,
                  longitude: route.destination.lng,
                },
              },
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
            languageCode: 'de',
          }),
        }
      );

      if (!response.ok) {
        console.error(`Google Routes API error for ${route.id}:`, response.status);
        continue;
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];

        // Parse duration strings (e.g., "300s" -> 300)
        const durationInTraffic = parseInt(routeData.duration?.replace('s', '') || '0');
        const staticDuration = parseInt(routeData.staticDuration?.replace('s', '') || '0');
        const distanceMeters = routeData.distanceMeters || 0;

        const delay = Math.max(0, durationInTraffic - staticDuration);
        const distanceKm = distanceMeters / 1000;

        // Berechne Geschwindigkeiten
        const avgSpeed = staticDuration > 0 ? (distanceKm / staticDuration) * 3600 : 50;
        const currentSpeed = durationInTraffic > 0 ? (distanceKm / durationInTraffic) * 3600 : avgSpeed;

        segments.push({
          id: route.id,
          name: route.name,
          level: getTrafficLevel(delay, staticDuration || 1),
          speed: Math.round(currentSpeed),
          freeFlowSpeed: Math.round(avgSpeed),
          delay,
          distance: Math.round(distanceKm * 10) / 10,
          duration: staticDuration,
          durationInTraffic,
        });
      }
    } catch (error) {
      console.error(`Error fetching traffic for ${route.id}:`, error);
    }
  }

  return segments;
}

/**
 * Fallback: Simulierte Verkehrsdaten basierend auf Tageszeit
 */
function simulateTrafficData(): TrafficSegment[] {
  const now = new Date();
  const hour = now.getHours();
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

  // Berufsverkehr-Faktoren
  let congestionFactor = 1.0;
  if (isWeekday) {
    if (hour >= 7 && hour <= 9) congestionFactor = 0.6 + Math.random() * 0.2;
    else if (hour >= 16 && hour <= 18) congestionFactor = 0.55 + Math.random() * 0.25;
    else if (hour >= 11 && hour <= 14) congestionFactor = 0.85 + Math.random() * 0.1;
  } else {
    congestionFactor = 0.9 + Math.random() * 0.1;
  }

  const segments: TrafficSegment[] = [
    {
      id: 'l30_kw',
      name: 'L30 → Königs Wusterhausen',
      freeFlowSpeed: 50,
      speed: Math.round(50 * congestionFactor),
      level: 'frei',
      delay: 0,
      distance: 4.2,
      duration: 300,
      durationInTraffic: Math.round(300 / congestionFactor),
    },
    {
      id: 'l30_kablow',
      name: 'L30 → Kablow',
      freeFlowSpeed: 50,
      speed: Math.round(50 * (congestionFactor + 0.1)),
      level: 'frei',
      delay: 0,
      distance: 3.1,
      duration: 220,
      durationInTraffic: Math.round(220 / (congestionFactor + 0.1)),
    },
    {
      id: 'a10',
      name: 'A10 (Schönefelder Kreuz)',
      freeFlowSpeed: 120,
      speed: Math.round(120 * (congestionFactor - 0.1)),
      level: 'frei',
      delay: 0,
      distance: 15.0,
      duration: 450,
      durationInTraffic: Math.round(450 / (congestionFactor - 0.1)),
    },
  ];

  // Update levels und delays
  for (const segment of segments) {
    segment.delay = segment.durationInTraffic - segment.duration;
    segment.level = getTrafficLevel(segment.delay, segment.duration);
  }

  return segments;
}

/**
 * Holt aktuelle Verkehrsdaten - Google API wenn verfügbar, sonst Simulation
 */
export async function fetchTrafficData(apiKey?: string): Promise<TrafficData> {
  let segments: TrafficSegment[] = [];
  let isLive = false;

  if (apiKey) {
    try {
      segments = await fetchGoogleTraffic(apiKey);
      if (segments.length > 0) {
        isLive = true;
      }
    } catch (error) {
      console.error('Google Traffic API error:', error);
    }
  }

  // Fallback auf simulierte Daten
  if (segments.length === 0) {
    segments = simulateTrafficData();
  }

  // Bestimme Overall-Level
  const levels: TrafficLevel[] = ['frei', 'leicht', 'stockend', 'stau'];
  const worstLevel = segments.reduce((worst, seg) => {
    const worstIdx = levels.indexOf(worst);
    const currentIdx = levels.indexOf(seg.level);
    return currentIdx > worstIdx ? seg.level : worst;
  }, 'frei' as TrafficLevel);

  return {
    segments,
    overallLevel: worstLevel,
    lastUpdated: new Date(),
    isLive,
  };
}

/**
 * Gibt Farbe für Traffic-Level zurück
 */
export function getTrafficColor(level: TrafficLevel): string {
  const colors: Record<TrafficLevel, string> = {
    frei: '#22c55e',
    leicht: '#84cc16',
    stockend: '#f59e0b',
    stau: '#ef4444',
  };
  return colors[level];
}

/**
 * Gibt Label für Traffic-Level zurück
 */
export function getTrafficLabel(level: TrafficLevel): string {
  const labels: Record<TrafficLevel, string> = {
    frei: 'Freie Fahrt',
    leicht: 'Leichter Verkehr',
    stockend: 'Stockender Verkehr',
    stau: 'Stau',
  };
  return labels[level];
}

/**
 * Formatiert Verzögerung
 */
export function formatDelay(seconds: number): string {
  if (seconds < 60) return 'keine Verzögerung';
  const minutes = Math.round(seconds / 60);
  if (minutes === 1) return '+1 Min';
  return `+${minutes} Min`;
}
