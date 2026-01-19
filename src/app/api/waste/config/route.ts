import { NextRequest, NextResponse } from 'next/server';
import { getCacheStatus, invalidateCache } from '@/lib/waste/sbazv-fetcher';

/**
 * GET /api/waste/config
 * Zeigt die aktuelle Konfiguration und Anleitung
 */
export async function GET() {
  const hasIcsUrl = !!process.env.SBAZV_ICS_URL;
  const cacheStatus = getCacheStatus();

  return NextResponse.json({
    success: true,
    config: {
      hasIcsUrl,
      icsUrlConfigured: hasIcsUrl ? 'Ja' : 'Nein - bitte SBAZV_ICS_URL setzen',
    },
    cacheStatus,
    anleitung: {
      title: 'So richtest du den automatischen SBAZV-Abruf ein',
      steps: [
        {
          step: 1,
          title: 'SBAZV-Seite öffnen',
          description: 'Gehe zu https://www.sbazv.de',
        },
        {
          step: 2,
          title: 'Zu Entsorgungsterminen navigieren',
          description: 'Klicke im Menü auf "Aktuelles" → "Entsorgungstermine"',
        },
        {
          step: 3,
          title: 'Abfallart wählen',
          description: 'Klicke auf "Restmüll-/Papiertonne, Gelbe Säcke, Laubsäcke"',
        },
        {
          step: 4,
          title: 'Adresse eingeben',
          description:
            'Wähle alle Abfallarten aus, dann: Gemeinde: "Königs Wusterhausen", Ortsteil: "Zernsdorf", Straße und Hausnummer eingeben',
        },
        {
          step: 5,
          title: 'Kalenderexport',
          description:
            'Auf der Ergebnisseite klicke auf "Kalenderexport" → "URL in die Zwischenablage kopieren" oder "URL anzeigen"',
        },
        {
          step: 6,
          title: 'URL speichern',
          description:
            'Kopiere die angezeigte URL. Sie sieht so aus: https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServiceServlet?ApplicationName=Calendar&SubmitAction=sync&StandortID=...&AboID=...&Fra=P;R;WB;L;GS',
        },
        {
          step: 7,
          title: 'Environment Variable setzen',
          description:
            'Füge in deiner .env.local Datei (oder bei Vercel unter Environment Variables) hinzu: SBAZV_ICS_URL=<deine-url>',
        },
        {
          step: 8,
          title: 'Server neustarten',
          description:
            'Starte den Entwicklungsserver neu oder deploye bei Vercel. Die Daten werden nun automatisch täglich um 6 Uhr synchronisiert.',
        },
      ],
      hinweise: [
        'Die URL enthält eine StandortID, die für deine spezifische Adresse generiert wird',
        'Alle Abfallarten (P;R;WB;L;GS) sind bereits in der URL enthalten',
        'Der Cron-Job läuft täglich um 6:00 Uhr und aktualisiert die Daten',
        'Die Daten werden 12 Stunden gecacht, um die SBAZV-Server nicht zu überlasten',
      ],
    },
    links: {
      sbazv: 'https://www.sbazv.de',
      entsorgungstermine:
        'https://www.sbazv.de/entsorgungstermine/restmuell-papier-gelbesaecke-laubsaecke-weihnachtsbaeume/',
      abfuhrportal:
        'https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServlet?SubmitAction=wasteDisposalServices&InFrameMode=TRUE',
    },
  });
}

/**
 * POST /api/waste/config
 * Testet eine ICS-URL ohne sie zu speichern
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testUrl = body.url;

    if (!testUrl) {
      return NextResponse.json(
        { success: false, error: 'URL fehlt im Request Body' },
        { status: 400 }
      );
    }

    // Validiere URL-Format
    if (
      !testUrl.includes('fahrzeuge.sbazv.de') ||
      !testUrl.includes('WasteManagementServiceServlet')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige URL. Die URL muss vom SBAZV-Kalenderexport stammen.',
        },
        { status: 400 }
      );
    }

    // Teste den Abruf
    const response = await fetch(testUrl, {
      headers: {
        Accept: 'text/calendar, application/ics, */*',
        'User-Agent': 'Zernsdorf-Portal/1.0 (Test)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `SBAZV returned ${response.status}: ${response.statusText}`,
        hint: 'Die URL ist möglicherweise abgelaufen. Bitte generiere eine neue URL auf der SBAZV-Seite.',
      });
    }

    const content = await response.text();

    if (!content.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({
        success: false,
        error: 'Die URL liefert keine gültige ICS-Datei',
        contentPreview: content.substring(0, 200),
      });
    }

    // Zähle Events
    const eventCount = (content.match(/BEGIN:VEVENT/g) || []).length;

    return NextResponse.json({
      success: true,
      message: 'URL ist gültig!',
      eventCount,
      hint: `Die ICS-Datei enthält ${eventCount} Termine. Füge die URL als SBAZV_ICS_URL in deine Environment Variables ein.`,
      nextStep:
        'Setze in .env.local oder bei Vercel: SBAZV_ICS_URL=' + testUrl.substring(0, 50) + '...',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Test fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
