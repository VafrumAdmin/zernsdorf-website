import { NextRequest, NextResponse } from 'next/server';
import { parseUploadedICS, getCacheStatus } from '@/lib/waste/sbazv-fetcher';

/**
 * POST /api/waste/upload
 * Ermöglicht das manuelle Hochladen einer ICS-Datei vom SBAZV
 *
 * So funktioniert's:
 * 1. Gehe zu https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServlet
 * 2. Wähle "Königs Wusterhausen" als Gemeinde
 * 3. Wähle "Zernsdorf" als Ortsteil
 * 4. Wähle deine Straße
 * 5. Klicke auf "ICS exportieren"
 * 6. Lade die heruntergeladene .ics Datei hier hoch
 *
 * Request Body (multipart/form-data oder application/json):
 * - file: ICS-Datei (bei multipart)
 * - icsContent: ICS-Inhalt als String (bei JSON)
 * - street: Straßenname (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let icsContent = '';
    let street = '';

    if (contentType.includes('multipart/form-data')) {
      // Datei-Upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      street = (formData.get('street') as string) || '';

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Keine Datei hochgeladen' },
          { status: 400 }
        );
      }

      // Prüfe Dateityp
      if (!file.name.endsWith('.ics') && file.type !== 'text/calendar') {
        return NextResponse.json(
          { success: false, error: 'Nur ICS-Dateien sind erlaubt' },
          { status: 400 }
        );
      }

      // Prüfe Dateigröße (max 1MB)
      if (file.size > 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Datei zu groß (max 1MB)' },
          { status: 400 }
        );
      }

      icsContent = await file.text();
    } else if (contentType.includes('application/json')) {
      // JSON-Upload
      const body = await request.json();
      icsContent = body.icsContent || '';
      street = body.street || '';

      if (!icsContent) {
        return NextResponse.json(
          { success: false, error: 'icsContent fehlt im Request Body' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type' },
        { status: 415 }
      );
    }

    // Parse und speichere die ICS-Daten
    const result = parseUploadedICS(icsContent, street);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'ICS-Datei konnte nicht verarbeitet werden',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ICS-Datei erfolgreich importiert',
      collectionsImported: result.collections.length,
      street: street || 'Alle Straßen',
      cacheStatus: getCacheStatus(),
      // Zeige die ersten 5 Termine als Vorschau
      preview: result.collections.slice(0, 5).map((c) => ({
        date: c.date,
        type: c.type,
      })),
    });
  } catch (error) {
    console.error('ICS Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Verarbeiten der Datei',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/waste/upload
 * Gibt Anweisungen zum Herunterladen der ICS-Datei vom SBAZV
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    instructions: {
      de: {
        title: 'SBAZV ICS-Kalender herunterladen',
        steps: [
          'Öffne https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServlet',
          'Wähle "Königs Wusterhausen" als Gemeinde',
          'Wähle "Zernsdorf" als Ortsteil',
          'Wähle deine Straße aus der Liste',
          'Klicke auf "ICS exportieren" oder "Kalender herunterladen"',
          'Lade die .ics Datei hier hoch',
        ],
      },
      en: {
        title: 'Download SBAZV ICS Calendar',
        steps: [
          'Open https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServlet',
          'Select "Königs Wusterhausen" as municipality',
          'Select "Zernsdorf" as district',
          'Select your street from the list',
          'Click "ICS export" or "Download calendar"',
          'Upload the .ics file here',
        ],
      },
    },
    uploadEndpoint: {
      method: 'POST',
      contentTypes: ['multipart/form-data', 'application/json'],
      fields: {
        file: 'ICS file (for multipart)',
        icsContent: 'ICS content as string (for JSON)',
        street: 'Street name (optional)',
      },
    },
    cacheStatus: getCacheStatus(),
  });
}
