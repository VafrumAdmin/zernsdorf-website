import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFromCustomUrl,
  getCacheStatus,
  ZERNSDORF_STREETS,
  isValidSbazvUrl,
} from '@/lib/waste/sbazv-fetcher';
import { parseICS, icsEventsToWasteCollections } from '@/lib/waste/ics-parser';
import { getNextCollection, getUpcomingCollections } from '@/lib/waste/mock-data';
import type { WasteType } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

/**
 * GET /api/waste
 * Holt Müllabfuhr-Termine vom SBAZV
 *
 * Query Parameters:
 * - icsUrl: SBAZV ICS-URL für die spezifische Adresse (erforderlich für korrekte Daten)
 * - type: Müllart filter (optional: restmuell, papier, gelbesack, bio, laubsaecke)
 * - days: Anzahl Tage in die Zukunft (optional, default: 30)
 * - next: Nur nächster Termin (optional, boolean)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const icsUrl = searchParams.get('icsUrl');
    const type = searchParams.get('type') as WasteType | null;
    const days = parseInt(searchParams.get('days') || '30', 10);
    const nextOnly = searchParams.get('next') === 'true';

    // Ohne ICS-URL können wir keine korrekten Daten liefern
    if (!icsUrl) {
      return NextResponse.json({
        success: false,
        error: 'Bitte richte zuerst deine Adresse ein, um die Abholtermine zu sehen.',
        needsSetup: true,
      });
    }

    // Validiere URL
    if (!isValidSbazvUrl(icsUrl)) {
      return NextResponse.json({
        success: false,
        error: 'Ungültige SBAZV-URL. Die URL muss vom SBAZV-Kalenderexport stammen.',
      }, { status: 400 });
    }

    // Hole ICS-Daten
    const result = await fetchIcsData(icsUrl);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Fehler beim Abrufen der Mülltermine',
          source: result.source,
        },
        { status: 500 }
      );
    }

    let collections = result.collections;

    // Filter nach Typ
    if (type) {
      collections = collections.filter((c) => c.type === type);
    }

    // Sortiere nach Datum
    collections = collections.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Nächsten Termin oder kommende Termine
    if (nextOnly) {
      const next = getNextCollection(collections, type || undefined);
      return NextResponse.json({
        success: true,
        data: next,
        source: result.source,
        address: result.address,
      });
    }

    // Kommende Termine im Zeitraum
    const upcoming = getUpcomingCollections(collections, days);

    return NextResponse.json({
      success: true,
      data: upcoming,
      total: upcoming.length,
      source: result.source,
      address: result.address,
      filters: {
        type: type || 'all',
        days,
      },
    });
  } catch (error) {
    console.error('Waste API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Hilfsfunktion zum Abrufen der ICS-Daten
async function fetchIcsData(icsUrl: string): Promise<{
  success: boolean;
  collections: any[];
  source: 'sbazv' | 'fallback';
  address?: string;
  error?: string;
}> {
  // Versuche mehrere Methoden
  const methods = [
    () => fetchDirectly(icsUrl),
    () => fetchViaProxy(icsUrl),
  ];

  for (const method of methods) {
    const result = await method();
    if (result.success) {
      return result;
    }
    console.log('[SBAZV] Method failed, trying next...');
  }

  // Alle Methoden fehlgeschlagen
  console.log('[SBAZV] All methods failed');
  return {
    success: false,
    collections: [],
    source: 'fallback',
    error: 'SBAZV-Server vorübergehend nicht erreichbar. Bitte versuche es später erneut.',
  };
}

// Direkter Abruf
async function fetchDirectly(icsUrl: string): Promise<{
  success: boolean;
  collections: any[];
  source: 'sbazv' | 'fallback';
  address?: string;
  error?: string;
}> {
  try {
    console.log('[SBAZV] Fetching ICS directly from:', icsUrl.substring(0, 80) + '...');

    const response = await fetch(icsUrl, {
      headers: {
        Accept: 'text/calendar, application/ics, */*',
        'User-Agent': 'Zernsdorf-Portal/1.0 (Waste Calendar Sync)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`SBAZV returned ${response.status}: ${response.statusText}`);
    }

    const icsContent = await response.text();
    return processIcsContent(icsContent);
  } catch (error) {
    console.error('[SBAZV] Direct fetch error:', error);
    return {
      success: false,
      collections: [],
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Direkter Abruf fehlgeschlagen',
    };
  }
}

// Abruf über Proxy-Service
async function fetchViaProxy(icsUrl: string): Promise<{
  success: boolean;
  collections: any[];
  source: 'sbazv' | 'fallback';
  address?: string;
  error?: string;
}> {
  try {
    // Verwende allorigins.win als Proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrl)}`;
    console.log('[SBAZV] Fetching via proxy...');

    const response = await fetch(proxyUrl, {
      headers: {
        Accept: 'text/calendar, application/ics, text/plain, */*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}: ${response.statusText}`);
    }

    const icsContent = await response.text();
    return processIcsContent(icsContent);
  } catch (error) {
    console.error('[SBAZV] Proxy fetch error:', error);
    return {
      success: false,
      collections: [],
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Proxy-Abruf fehlgeschlagen',
    };
  }
}

// ICS-Inhalt verarbeiten
function processIcsContent(icsContent: string): {
  success: boolean;
  collections: any[];
  source: 'sbazv' | 'fallback';
  address?: string;
  error?: string;
} {
  if (!icsContent.includes('BEGIN:VCALENDAR')) {
    return {
      success: false,
      collections: [],
      source: 'fallback',
      error: 'Keine gültige ICS-Datei erhalten',
    };
  }

  const events = parseICS(icsContent);

  // Extrahiere Adresse aus den Events (LOCATION-Feld)
  let address: string | undefined;
  const firstEventWithLocation = events.find(e => e.location);
  if (firstEventWithLocation?.location) {
    const locationMatch = firstEventWithLocation.location.match(/^([^,]+)/);
    if (locationMatch) {
      address = locationMatch[1].trim();
    }
  }

  const collections = icsEventsToWasteCollections(events, address || '');

  console.log('[SBAZV] Loaded', collections.length, 'collections for', address || 'unknown address');

  return {
    success: true,
    collections,
    source: 'sbazv',
    address,
  };
}

