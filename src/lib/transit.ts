// ÖPNV-Daten für Zernsdorf (VBB API Integration)
// Buslinien 721, 723 und Regionalbahn RB36

const VBB_API_BASE = 'https://v6.vbb.transport.rest';

// Königs Wusterhausen Bahnhof Station ID
export const KW_BAHNHOF_ID = '900260001';

export interface TransitStop {
  id: string;
  vbbId: string;
  name: string;
  location: { lat: number; lng: number };
  products: {
    bus: boolean;
    regional: boolean;
  };
}

export interface TransitDeparture {
  line: string;
  lineName: string;
  direction: string;
  plannedTime: Date;
  actualTime: Date | null;
  delay: number; // in seconds
  platform?: string;
  stop: string;
  stopId: string;
  product: 'bus' | 'regional';
  operator?: string;
  cancelled?: boolean;
}

export interface TransitData {
  departures: TransitDeparture[];
  stop: TransitStop;
  isLive: boolean;
  lastUpdated: Date;
}

// Alle Haltestellen in Zernsdorf mit VBB-IDs
export const ZERNSDORF_STOPS: TransitStop[] = [
  {
    id: 'bahnhof',
    vbbId: '900260011',
    name: 'Zernsdorf, Bahnhof',
    location: { lat: 52.299358, lng: 13.693241 },
    products: { bus: true, regional: true },
  },
  {
    id: 'dorfaue',
    vbbId: '900261035',
    name: 'Zernsdorf, Dorfaue',
    location: { lat: 52.298971, lng: 13.698239 },
    products: { bus: true, regional: false },
  },
  {
    id: 'strandweg',
    vbbId: '900261037',
    name: 'Zernsdorf, Strandweg',
    location: { lat: 52.297695, lng: 13.690517 },
    products: { bus: true, regional: true },
  },
  {
    id: 'an-der-lanke',
    vbbId: '900261033',
    name: 'Zernsdorf, An der Lanke',
    location: { lat: 52.306873, lng: 13.701925 },
    products: { bus: true, regional: false },
  },
  {
    id: 'bahnuebergang',
    vbbId: '900261034',
    name: 'Zernsdorf, Bahnübergang',
    location: { lat: 52.303, lng: 13.699 },
    products: { bus: true, regional: false },
  },
  {
    id: 'friedrich-engels-str',
    vbbId: '900261039',
    name: 'Zernsdorf, Friedrich-Engels-Str.',
    location: { lat: 52.301, lng: 13.697 },
    products: { bus: true, regional: false },
  },
  {
    id: 'nordstr',
    vbbId: '900261036',
    name: 'Zernsdorf, Nordstr.',
    location: { lat: 52.308, lng: 13.696 },
    products: { bus: true, regional: false },
  },
  {
    id: 'ruetgersstr',
    vbbId: '900261052',
    name: 'Zernsdorf, Rütgersstr.',
    location: { lat: 52.295, lng: 13.685 },
    products: { bus: true, regional: false },
  },
  {
    id: 'seekorso',
    vbbId: '900261038',
    name: 'Zernsdorf, Seekorso',
    location: { lat: 52.309, lng: 13.698 },
    products: { bus: true, regional: false },
  },
  {
    id: 'wustroweg',
    vbbId: '900261041',
    name: 'Zernsdorf, Wustroweg',
    location: { lat: 52.293, lng: 13.680 },
    products: { bus: true, regional: false },
  },
  {
    id: 'zeltplatz',
    vbbId: '900261040',
    name: 'Zernsdorf, Zeltplatz',
    location: { lat: 52.311, lng: 13.693 },
    products: { bus: true, regional: false },
  },
];

// Bekannte Straßen in Zernsdorf mit zugeordneten Haltestellen
const STREET_TO_STOPS: Record<string, string[]> = {
  // Zentrum / Dorfaue
  'dorfaue': ['dorfaue', 'bahnhof'],
  'dorfstraße': ['dorfaue', 'bahnhof'],
  'bahnhofstraße': ['bahnhof', 'dorfaue'],
  'am bahnhof': ['bahnhof'],

  // Strandbereich
  'strandweg': ['strandweg', 'dorfaue'],
  'seestraße': ['strandweg', 'dorfaue'],
  'am zeuthener see': ['strandweg'],

  // Nordbereich
  'nordstraße': ['nordstr', 'seekorso'],
  'nordstr': ['nordstr', 'seekorso'],
  'seekorso': ['seekorso', 'nordstr'],
  'an der lanke': ['an-der-lanke', 'seekorso'],
  'lankeweg': ['an-der-lanke'],

  // Zeltplatzbereich
  'zeltplatz': ['zeltplatz', 'nordstr'],
  'am zeltplatz': ['zeltplatz'],

  // Friedrich-Engels-Straße Bereich
  'friedrich-engels-straße': ['friedrich-engels-str', 'bahnuebergang'],
  'friedrich-engels-str': ['friedrich-engels-str', 'bahnuebergang'],

  // Bahnübergang Bereich
  'karl-marx-straße': ['bahnuebergang', 'friedrich-engels-str'],

  // Rütgersstraße Bereich (Richtung Neue Mühle)
  'rütgersstraße': ['ruetgersstr', 'wustroweg'],
  'rütgersstr': ['ruetgersstr', 'wustroweg'],

  // Wustroweg Bereich
  'wustroweg': ['wustroweg', 'ruetgersstr'],
  'wustrower weg': ['wustroweg'],
};

/**
 * Findet die nächsten Haltestellen basierend auf einer Adresse
 */
export function findNearestStops(address: string): TransitStop[] {
  const normalizedAddress = address.toLowerCase().trim();

  // Prüfe ob Straßenname in der Adresse vorkommt
  for (const [street, stopIds] of Object.entries(STREET_TO_STOPS)) {
    if (normalizedAddress.includes(street)) {
      return stopIds
        .map(id => ZERNSDORF_STOPS.find(s => s.id === id))
        .filter((s): s is TransitStop => s !== undefined);
    }
  }

  // Fallback: Bahnhof und Dorfaue (zentral)
  return ZERNSDORF_STOPS.filter(s => s.id === 'bahnhof' || s.id === 'dorfaue');
}

/**
 * Berechnet Distanz zwischen zwei Koordinaten (Haversine)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Erdradius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Findet die nächsten Haltestellen basierend auf Koordinaten
 */
export function findNearestStopsByCoords(
  lat: number,
  lng: number,
  limit: number = 3
): TransitStop[] {
  return ZERNSDORF_STOPS
    .map(stop => ({
      stop,
      distance: calculateDistance(lat, lng, stop.location.lat, stop.location.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(item => item.stop);
}

/**
 * Holt Live-Abfahrten von der VBB API
 * @param duration - Zeitraum in Minuten (default: 720 = 12 Stunden)
 */
export async function fetchDepartures(
  vbbStopId: string,
  duration: number = 720
): Promise<TransitDeparture[]> {
  const url = `${VBB_API_BASE}/stops/${vbbStopId}/departures?duration=${duration}`;

  // Create AbortController with 8 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: 30 }, // Cache für 30 Sekunden
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VBB API error: ${response.status}`);
    }

    const data = await response.json();
  const departures: TransitDeparture[] = [];

  // Handle both array and object with departures key
  const rawDepartures = Array.isArray(data) ? data : data.departures || [];

  for (const dep of rawDepartures) {
    const line = dep.line || {};
    const product = line.product === 'regional' ? 'regional' : 'bus';

    departures.push({
      line: line.id || '',
      lineName: line.name || '',
      direction: dep.direction || '',
      plannedTime: new Date(dep.plannedWhen || dep.when),
      actualTime: dep.when ? new Date(dep.when) : null,
      delay: dep.delay || 0,
      platform: dep.platform || undefined,
      stop: dep.stop?.name || '',
      stopId: dep.stop?.id || vbbStopId,
      product,
      operator: line.operator?.name || undefined,
      cancelled: dep.cancelled || false,
    });
  }

  return departures;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`[Transit] Timeout for stop ${vbbStopId}`);
    } else {
      console.error(`[Transit] Error fetching stop ${vbbStopId}:`, error);
    }
    throw error;
  }
}

/**
 * Holt Abfahrten für mehrere Haltestellen und kombiniert sie
 */
export async function fetchMultiStopDepartures(
  stops: TransitStop[],
  limit: number = 10
): Promise<{ departures: TransitDeparture[]; isLive: boolean }> {
  try {
    const allDepartures: TransitDeparture[] = [];

    // Parallel alle Haltestellen abfragen
    const results = await Promise.allSettled(
      stops.map(stop => fetchDepartures(stop.vbbId, 720))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allDepartures.push(...result.value);
      }
    }

    // Sortiere nach Abfahrtszeit und entferne Duplikate
    const uniqueDepartures = allDepartures
      .filter(dep => !dep.cancelled)
      .sort((a, b) => {
        const timeA = a.actualTime || a.plannedTime;
        const timeB = b.actualTime || b.plannedTime;
        return timeA.getTime() - timeB.getTime();
      })
      .filter((dep, index, arr) => {
        // Entferne Duplikate (gleiche Linie, Richtung, Zeit)
        return !arr.slice(0, index).some(
          d =>
            d.lineName === dep.lineName &&
            d.direction === dep.direction &&
            Math.abs(
              (d.actualTime || d.plannedTime).getTime() -
                (dep.actualTime || dep.plannedTime).getTime()
            ) < 60000 // Weniger als 1 Minute Unterschied
        );
      })
      .slice(0, limit);

    return {
      departures: uniqueDepartures,
      isLive: uniqueDepartures.length > 0,
    };
  } catch (error) {
    console.error('Error fetching departures:', error);
    return { departures: [], isLive: false };
  }
}

/**
 * Formatiert Verspätung
 */
export function formatDelay(seconds: number): string {
  if (seconds === 0) return '';
  const minutes = Math.round(seconds / 60);
  if (minutes > 0) return `+${minutes}`;
  return `${minutes}`;
}

/**
 * Formatiert Uhrzeit
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Berechnet Minuten bis Abfahrt
 */
export function getMinutesUntil(date: Date): number {
  const now = new Date();
  return Math.round((date.getTime() - now.getTime()) / 60000);
}

/**
 * Formatiert Minuten bis Abfahrt
 */
export function formatMinutesUntil(date: Date): string {
  const minutes = getMinutesUntil(date);
  if (minutes <= 0) return 'Jetzt';
  if (minutes === 1) return '1 Min';
  return `${minutes} Min`;
}

/**
 * Gibt Farbe für Linie zurück
 */
export function getLineColor(lineName: string): string {
  const colors: Record<string, string> = {
    '721': '#0066cc',
    '723': '#cc6600',
    'RB36': '#e30613',
  };
  return colors[lineName] || '#666666';
}

/**
 * Gibt Icon für Produkt zurück
 */
export function getProductIcon(product: 'bus' | 'regional'): string {
  return product === 'regional' ? '🚆' : '🚌';
}

/**
 * Holt Abfahrten für Königs Wusterhausen Bahnhof
 * Mit optionalem Filter für Produkte
 */
export async function fetchKWDepartures(
  products: ('regional' | 'suburban' | 'bus')[] = ['regional', 'suburban', 'bus'],
  duration: number = 60
): Promise<TransitDeparture[]> {
  // Build URL with product filters
  let url = `${VBB_API_BASE}/stops/${KW_BAHNHOF_ID}/departures?duration=${duration}`;

  // Add product filters
  const allProducts = ['suburban', 'subway', 'tram', 'bus', 'ferry', 'express', 'regional'];
  for (const prod of allProducts) {
    const enabled = products.includes(prod as 'regional' | 'suburban' | 'bus');
    url += `&${prod}=${enabled ? 'true' : 'false'}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      next: { revalidate: 30 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VBB API error: ${response.status}`);
    }

    const data = await response.json();
    const departures: TransitDeparture[] = [];
    const rawDepartures = Array.isArray(data) ? data : data.departures || [];

    for (const dep of rawDepartures) {
      const line = dep.line || {};
      let product: 'bus' | 'regional' = 'bus';
      if (line.product === 'regional' || line.product === 'suburban' || line.product === 'express') {
        product = 'regional';
      }

      departures.push({
        line: line.id || '',
        lineName: line.name || '',
        direction: dep.direction || '',
        plannedTime: new Date(dep.plannedWhen || dep.when),
        actualTime: dep.when ? new Date(dep.when) : null,
        delay: dep.delay || 0,
        platform: dep.platform || undefined,
        stop: dep.stop?.name || 'Königs Wusterhausen',
        stopId: dep.stop?.id || KW_BAHNHOF_ID,
        product,
        operator: line.operator?.name || undefined,
        cancelled: dep.cancelled || false,
      });
    }

    return departures.filter(d => !d.cancelled);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Transit] Timeout for KW Bahnhof');
    } else {
      console.error('[Transit] Error fetching KW:', error);
    }
    return [];
  }
}

/**
 * Berechnet ob man einen Zug in KW noch erreichen kann
 */
export interface ConnectionCheck {
  targetDeparture: TransitDeparture;
  canReachByCar: boolean;
  canReachByBus: boolean;
  canReachByTrain: boolean;
  carTravelTime: number; // in minutes
  busDeparture?: TransitDeparture;
  trainDeparture?: TransitDeparture;
  bufferTime: number; // minutes until target departure
  recommendation: 'car' | 'bus' | 'train' | 'unlikely';
}

/**
 * Prüft Anschlussmöglichkeiten zum KW Bahnhof
 */
export function checkConnection(
  targetDeparture: TransitDeparture,
  zernsdorfDepartures: TransitDeparture[],
  trafficLevel: 'frei' | 'leicht' | 'stockend' | 'stau' = 'frei'
): ConnectionCheck {
  const now = new Date();
  const targetTime = targetDeparture.actualTime || targetDeparture.plannedTime;
  const bufferTime = Math.round((targetTime.getTime() - now.getTime()) / 60000);

  // Auto-Fahrzeit nach KW je nach Verkehrslage
  const carTravelTimes: Record<string, number> = {
    frei: 8,      // 8 Minuten bei freier Fahrt
    leicht: 10,   // 10 Minuten bei leichtem Verkehr
    stockend: 15, // 15 Minuten bei stockendem Verkehr
    stau: 25,     // 25 Minuten bei Stau
  };
  const carTravelTime = carTravelTimes[trafficLevel] || 10;
  const carArrivalBuffer = 5; // 5 Minuten Puffer fürs Parken

  // Prüfe ob Auto es schafft
  const canReachByCar = bufferTime >= carTravelTime + carArrivalBuffer;

  // Finde passenden Bus/Zug von Zernsdorf
  const requiredArrivalTime = new Date(targetTime.getTime() - 5 * 60000); // 5 Min Umsteigezeit

  const connectingTransit = zernsdorfDepartures
    .filter(dep => {
      const depTime = dep.actualTime || dep.plannedTime;
      // Abfahrt muss nach jetzt sein und Ankunft vor Zielzug
      if (depTime <= now) return false;

      // Geschätzte Ankunftszeit (Bus ~12 Min, Zug ~8 Min nach KW)
      const travelTime = dep.product === 'regional' ? 8 : 12;
      const arrivalTime = new Date(depTime.getTime() + travelTime * 60000);
      return arrivalTime <= requiredArrivalTime;
    })
    .sort((a, b) => {
      const timeA = (a.actualTime || a.plannedTime).getTime();
      const timeB = (b.actualTime || b.plannedTime).getTime();
      return timeB - timeA; // Späteste passende Verbindung zuerst
    });

  const busDeparture = connectingTransit.find(d => d.product === 'bus');
  const trainDeparture = connectingTransit.find(d => d.product === 'regional');

  const canReachByBus = !!busDeparture;
  const canReachByTrain = !!trainDeparture;

  // Empfehlung
  let recommendation: 'car' | 'bus' | 'train' | 'unlikely' = 'unlikely';
  if (canReachByTrain) {
    recommendation = 'train';
  } else if (canReachByBus) {
    recommendation = 'bus';
  } else if (canReachByCar) {
    recommendation = 'car';
  }

  return {
    targetDeparture,
    canReachByCar,
    canReachByBus,
    canReachByTrain,
    carTravelTime,
    busDeparture,
    trainDeparture,
    bufferTime,
    recommendation,
  };
}
