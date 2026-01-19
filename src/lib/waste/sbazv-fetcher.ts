import { parseICS, icsEventsToWasteCollections } from './ics-parser';
import { ZERNSDORF_STREETS, isValidSbazvUrl, parseIcsUrl, buildIcsUrl, SBAZV_PORTAL_URL, getIcsUrlForStreet } from './zernsdorf-streets';
import type { WasteCollection } from '@/types';

// SBAZV (Südbrandenburgischer Abfallzweckverband) ICS Calendar Fetcher
// WICHTIG: Jede Adresse in Zernsdorf hat eine eigene StandortID!
// Die ICS-URL muss vom Nutzer selbst über das SBAZV-Portal geholt werden.

// Re-export für einfachen Zugriff
export { ZERNSDORF_STREETS, isValidSbazvUrl, parseIcsUrl, buildIcsUrl, SBAZV_PORTAL_URL };

// ICS URL aus Environment Variable (vom Nutzer konfiguriert)
const SBAZV_ICS_URL = process.env.SBAZV_ICS_URL || '';

export const SBAZV_CONFIG = {
  gemeinde: 'Königs Wusterhausen',
  ortsteil: 'Zernsdorf',
  landkreis: 'Dahme-Spreewald',
  // Fra-Parameter für die Abfallarten:
  // P = Papier
  // R = Restmüll
  // WB = Gelber Sack (Wertstoffbeutel)
  // L = Laubsäcke
  // GS = Weihnachtsbäume (Grünschnitt Saisonal)
  wasteTypes: {
    restmuell: 'R',
    papier: 'P',
    gelbesack: 'WB',
    bio: '', // Bio wird beim SBAZV nicht unterstützt
    laubsaecke: 'L',
  },
};

export interface SBAZVFetchResult {
  success: boolean;
  collections: WasteCollection[];
  lastFetched: Date;
  error?: string;
  source: 'sbazv' | 'cache' | 'fallback';
}

// Cache für die Mülltermine (in-memory für Serverless)
let cachedCollections: WasteCollection[] = [];
let lastFetchTime: Date | null = null;
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Stunden

/**
 * Fetcht den ICS-Kalender vom SBAZV
 * Verwendet die konfigurierte SBAZV_ICS_URL Environment Variable
 */
export async function fetchSBAZVCalendar(street: string): Promise<SBAZVFetchResult> {
  // Prüfe Cache
  if (cachedCollections.length > 0 && lastFetchTime) {
    const cacheAge = Date.now() - lastFetchTime.getTime();
    if (cacheAge < CACHE_DURATION_MS) {
      return {
        success: true,
        collections: cachedCollections.filter((c) => !street || c.street === street),
        lastFetched: lastFetchTime,
        source: 'cache',
      };
    }
  }

  // Prüfe ob ICS-URL konfiguriert ist
  if (!SBAZV_ICS_URL) {
    console.warn('SBAZV_ICS_URL not configured, using fallback');
    return await fetchWithFallback(street);
  }

  try {
    console.log('[SBAZV] Fetching ICS from:', SBAZV_ICS_URL.substring(0, 80) + '...');

    const response = await fetch(SBAZV_ICS_URL, {
      headers: {
        Accept: 'text/calendar, application/ics, */*',
        'User-Agent': 'Zernsdorf-Portal/1.0 (Waste Calendar Sync)',
      },
      // 15 Sekunden Timeout
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`SBAZV API returned ${response.status}: ${response.statusText}`);
    }

    const icsContent = await response.text();
    console.log('[SBAZV] Received content length:', icsContent.length);

    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      console.error('[SBAZV] Invalid ICS content, first 200 chars:', icsContent.substring(0, 200));
      throw new Error('Invalid ICS content received - not a valid calendar file');
    }

    const events = parseICS(icsContent);
    console.log('[SBAZV] Parsed events:', events.length);

    const collections = icsEventsToWasteCollections(events, street);
    console.log('[SBAZV] Converted to collections:', collections.length);

    // Cache aktualisieren
    cachedCollections = collections;
    lastFetchTime = new Date();

    return {
      success: true,
      collections,
      lastFetched: lastFetchTime,
      source: 'sbazv',
    };
  } catch (error) {
    console.error('[SBAZV] Fetch error:', error);
    return await fetchWithFallback(street);
  }
}

/**
 * Fallback-Mechanismus wenn der direkte SBAZV-Abruf nicht funktioniert
 * Verwendet die lokale ICS-Datei falls vorhanden
 */
async function fetchWithFallback(street: string): Promise<SBAZVFetchResult> {
  // Prüfe ob wir gecachte Daten haben
  if (cachedCollections.length > 0 && lastFetchTime) {
    return {
      success: true,
      collections: cachedCollections.filter((c) => !street || c.street === street),
      lastFetched: lastFetchTime,
      source: 'cache',
      error: 'Using cached data - SBAZV direct fetch failed',
    };
  }

  // Generiere realistische Fallback-Daten basierend auf typischen SBAZV-Intervallen
  const fallbackCollections = generateRealisticFallback(street);

  return {
    success: true,
    collections: fallbackCollections,
    lastFetched: new Date(),
    source: 'fallback',
    error:
      'SBAZV-Daten konnten nicht abgerufen werden. Bitte ICS-Datei manuell hochladen oder später erneut versuchen.',
  };
}

/**
 * Generiert realistische Fallback-Daten basierend auf typischen SBAZV-Abholintervallen
 */
function generateRealisticFallback(street: string): WasteCollection[] {
  const collections: WasteCollection[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Finde den nächsten spezifischen Wochentag
  const getNextWeekday = (start: Date, targetDay: number): Date => {
    const result = new Date(start);
    const currentDay = result.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    result.setDate(result.getDate() + daysToAdd);
    return result;
  };

  // Restmüll: 14-tägig am Dienstag (typisch für SBAZV)
  let restmuellDate = getNextWeekday(today, 2);
  for (let i = 0; i < 12; i++) {
    collections.push({
      id: `fallback-restmuell-${i}`,
      date: new Date(restmuellDate),
      type: 'restmuell',
      street,
    });
    restmuellDate.setDate(restmuellDate.getDate() + 14);
  }

  // Papier: 4-wöchig am Mittwoch
  let papierDate = getNextWeekday(today, 3);
  papierDate.setDate(papierDate.getDate() + 7);
  for (let i = 0; i < 6; i++) {
    collections.push({
      id: `fallback-papier-${i}`,
      date: new Date(papierDate),
      type: 'papier',
      street,
    });
    papierDate.setDate(papierDate.getDate() + 28);
  }

  // Gelber Sack: 14-tägig am Donnerstag
  let gelbDate = getNextWeekday(today, 4);
  for (let i = 0; i < 12; i++) {
    collections.push({
      id: `fallback-gelbesack-${i}`,
      date: new Date(gelbDate),
      type: 'gelbesack',
      street,
    });
    gelbDate.setDate(gelbDate.getDate() + 14);
  }

  // Bio: wöchentlich am Freitag (April - Oktober)
  const month = today.getMonth();
  if (month >= 3 && month <= 9) {
    let bioDate = getNextWeekday(today, 5);
    for (let i = 0; i < 12; i++) {
      collections.push({
        id: `fallback-bio-${i}`,
        date: new Date(bioDate),
        type: 'bio',
        street,
      });
      bioDate.setDate(bioDate.getDate() + 7);
    }
  }

  // Laubsäcke: 14-tägig am Montag (Oktober - November)
  if (month >= 9 && month <= 10) {
    let laubDate = getNextWeekday(today, 1);
    for (let i = 0; i < 4; i++) {
      collections.push({
        id: `fallback-laubsaecke-${i}`,
        date: new Date(laubDate),
        type: 'laubsaecke',
        street,
      });
      laubDate.setDate(laubDate.getDate() + 14);
    }
  }

  return collections.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Lädt ICS-Daten aus einer Datei (für manuellen Upload)
 */
export function parseUploadedICS(icsContent: string, street: string): SBAZVFetchResult {
  try {
    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      throw new Error('Ungültige ICS-Datei');
    }

    const events = parseICS(icsContent);
    const collections = icsEventsToWasteCollections(events, street);

    // Cache aktualisieren
    cachedCollections = collections;
    lastFetchTime = new Date();

    return {
      success: true,
      collections,
      lastFetched: lastFetchTime,
      source: 'sbazv',
    };
  } catch (error) {
    return {
      success: false,
      collections: [],
      lastFetched: new Date(),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'ICS-Parsing fehlgeschlagen',
    };
  }
}

/**
 * Gibt den aktuellen Cache-Status zurück
 */
export function getCacheStatus(): {
  hasCache: boolean;
  lastFetched: Date | null;
  collectionCount: number;
  cacheAgeMinutes: number | null;
} {
  const cacheAge = lastFetchTime ? Math.round((Date.now() - lastFetchTime.getTime()) / 60000) : null;

  return {
    hasCache: cachedCollections.length > 0,
    lastFetched: lastFetchTime,
    collectionCount: cachedCollections.length,
    cacheAgeMinutes: cacheAge,
  };
}

/**
 * Invalidiert den Cache (z.B. nach manuellem Upload)
 */
export function invalidateCache(): void {
  cachedCollections = [];
  lastFetchTime = null;
}

/**
 * Holt ICS-Daten von einer benutzerdefinierten URL
 * Wird verwendet wenn der Nutzer seine eigene SBAZV-URL einträgt
 */
export async function fetchFromCustomUrl(
  icsUrl: string,
  street: string
): Promise<SBAZVFetchResult> {
  // Validiere URL
  if (
    !icsUrl.includes('fahrzeuge.sbazv.de') ||
    !icsUrl.includes('WasteManagementServiceServlet')
  ) {
    return {
      success: false,
      collections: [],
      lastFetched: new Date(),
      source: 'fallback',
      error: 'Ungültige SBAZV-URL. Die URL muss vom SBAZV-Kalenderexport stammen.',
    };
  }

  try {
    console.log('[SBAZV Custom] Fetching from user URL...');

    const response = await fetch(icsUrl, {
      headers: {
        Accept: 'text/calendar, application/ics, */*',
        'User-Agent': 'Zernsdorf-Portal/1.0 (Waste Calendar Sync)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`SBAZV returned ${response.status}: ${response.statusText}`);
    }

    const icsContent = await response.text();

    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      throw new Error('Keine gültige ICS-Datei erhalten');
    }

    const events = parseICS(icsContent);
    const collections = icsEventsToWasteCollections(events, street);

    console.log('[SBAZV Custom] Loaded', collections.length, 'collections');

    return {
      success: true,
      collections,
      lastFetched: new Date(),
      source: 'sbazv',
    };
  } catch (error) {
    console.error('[SBAZV Custom] Error:', error);
    return {
      success: false,
      collections: [],
      lastFetched: new Date(),
      source: 'fallback',
      error:
        error instanceof Error
          ? error.message
          : 'Fehler beim Abrufen der Daten von der SBAZV-URL',
    };
  }
}

/**
 * Holt ICS-Daten für eine bestimmte Zernsdorfer Straße
 * Verwendet die vordefinierten StandortIDs aus zernsdorf-streets.ts
 */
export async function fetchForStreet(streetName: string): Promise<SBAZVFetchResult> {
  const icsUrl = getIcsUrlForStreet(streetName);

  if (!icsUrl) {
    console.warn('[SBAZV] Unknown street:', streetName);
    return {
      success: false,
      collections: [],
      lastFetched: new Date(),
      source: 'fallback',
      error: `Unbekannte Straße: "${streetName}". Bitte wähle eine Straße aus der Liste.`,
    };
  }

  try {
    console.log('[SBAZV] Fetching for street:', streetName);

    const response = await fetch(icsUrl, {
      headers: {
        Accept: 'text/calendar, application/ics, */*',
        'User-Agent': 'Zernsdorf-Portal/1.0 (Waste Calendar Sync)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`SBAZV returned ${response.status}: ${response.statusText}`);
    }

    const icsContent = await response.text();

    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      throw new Error('Keine gültige ICS-Datei erhalten');
    }

    const events = parseICS(icsContent);
    const collections = icsEventsToWasteCollections(events, streetName);

    console.log('[SBAZV] Loaded', collections.length, 'collections for', streetName);

    return {
      success: true,
      collections,
      lastFetched: new Date(),
      source: 'sbazv',
    };
  } catch (error) {
    console.error('[SBAZV] Error fetching for street:', streetName, error);
    return {
      success: false,
      collections: [],
      lastFetched: new Date(),
      source: 'fallback',
      error:
        error instanceof Error
          ? error.message
          : 'Fehler beim Abrufen der Mülltermine',
    };
  }
}
