import { NextRequest, NextResponse } from 'next/server';
import { ZERNSDORF_STREETS } from '@/lib/waste/zernsdorf-streets';

export const dynamic = 'force-dynamic';

// SBAZV Session Manager - hält eine aktive Session für API-Anfragen
let sbazvSession: {
  sessionId: string;
  cookies: string;
  lastUsed: number;
} | null = null;

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 Minuten

/**
 * Startet eine neue SBAZV-Session
 */
async function startSession(): Promise<{ sessionId: string; cookies: string } | null> {
  try {
    const response = await fetch(
      'https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServlet?SubmitAction=wasteDisposalServices&InFrameMode=TRUE',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      }
    );

    const html = await response.text();
    const cookies = response.headers.get('set-cookie') || '';

    // Session ID aus HTML extrahieren
    const sessionMatch = html.match(/SessionId"[^>]*VALUE="([^"]+)"/);
    if (!sessionMatch) {
      console.error('[SBAZV] Could not find session ID');
      return null;
    }

    return {
      sessionId: sessionMatch[1],
      cookies,
    };
  } catch (error) {
    console.error('[SBAZV] Session start error:', error);
    return null;
  }
}

/**
 * Holt oder erstellt eine gültige Session
 */
async function getSession(): Promise<{ sessionId: string; cookies: string } | null> {
  const now = Date.now();

  if (sbazvSession && (now - sbazvSession.lastUsed) < SESSION_TIMEOUT) {
    sbazvSession.lastUsed = now;
    return sbazvSession;
  }

  const newSession = await startSession();
  if (newSession) {
    sbazvSession = {
      ...newSession,
      lastUsed: now,
    };
  }
  return newSession;
}

/**
 * Sendet eine Anfrage an das SBAZV-Formular
 */
async function sbazvRequest(
  session: { sessionId: string; cookies: string },
  action: string,
  params: Record<string, string>
): Promise<string> {
  const formData = new URLSearchParams({
    SessionId: session.sessionId,
    SubmitAction: action,
    InFrameMode: 'TRUE',
    Ajax: 'true',
    AjaxOnPage: 'true',
    ApplicationName: 'com.athos.nl.mvc.abfterm.CheckAbfuhrTermineParameterBusinessCase',
    PageName: 'Lageadresse',
    ...params,
  });

  const response = await fetch(
    'https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServlet',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': session.cookies,
      },
      body: formData.toString(),
    }
  );

  return response.text();
}

/**
 * Extrahiert Optionen aus einem SELECT-Element im HTML
 */
function extractOptions(html: string, selectName: string): string[] {
  // Finde das SELECT-Element
  const selectRegex = new RegExp(`<SELECT[^>]*NAME="${selectName}"[^>]*>([\\s\\S]*?)</SELECT>`, 'i');
  const selectMatch = html.match(selectRegex);

  if (!selectMatch) return [];

  const selectHtml = selectMatch[1];
  const options: string[] = [];

  // Extrahiere alle OPTION-Werte
  const optionRegex = /<OPTION[^>]*VALUE="([^"]*)"[^>]*>/gi;
  let match;

  while ((match = optionRegex.exec(selectHtml)) !== null) {
    const value = match[1]
      .replace(/&nbsp;/g, ' ')
      .replace(/&auml;/g, 'ä')
      .replace(/&ouml;/g, 'ö')
      .replace(/&uuml;/g, 'ü')
      .replace(/&Auml;/g, 'Ä')
      .replace(/&Ouml;/g, 'Ö')
      .replace(/&Uuml;/g, 'Ü')
      .replace(/&szlig;/g, 'ß')
      .trim();

    if (value) {
      options.push(value);
    }
  }

  return options;
}

/**
 * GET /api/waste/sbazv-lookup
 *
 * Query Parameters:
 * - action: 'streets' | 'housenumbers' | 'calendar-url'
 * - street: Straßenname (für housenumbers und calendar-url)
 * - housenumber: Hausnummer (für calendar-url)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const street = searchParams.get('street');
    const housenumber = searchParams.get('housenumber');

    // Session starten/wiederverwenden
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Konnte keine Verbindung zum SBAZV herstellen',
      }, { status: 503 });
    }

    // Zuerst Königs Wusterhausen als Ort setzen
    const cityResponse = await sbazvRequest(session, 'CITYCHANGED', {
      Ort: 'Königs Wusterhausen',
    });

    if (action === 'streets') {
      // Straßen für Königs Wusterhausen abrufen
      const allStreets = extractOptions(cityResponse, 'Strasse');

      // Finde die SBAZV-Namen für bekannte Zernsdorfer Straßen
      const matchedStreets: { value: string; label: string }[] = [];

      for (const zernsdorfStreet of ZERNSDORF_STREETS) {
        // Suche nach exakter Übereinstimmung mit "(Zernsdorf)" Suffix
        const exactMatch = allStreets.find(s =>
          s === `${zernsdorfStreet} (Zernsdorf)` ||
          s === `${zernsdorfStreet} (Zernsdorf (Kablow-Ziegelei))`
        );

        if (exactMatch) {
          matchedStreets.push({
            value: exactMatch,
            label: zernsdorfStreet
          });
        } else {
          // Suche nach Straße ohne Ortsangabe (falls eindeutig)
          const simpleMatch = allStreets.find(s => s === zernsdorfStreet);
          if (simpleMatch) {
            matchedStreets.push({
              value: simpleMatch,
              label: zernsdorfStreet
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        streets: matchedStreets.sort((a, b) => a.label.localeCompare(b.label, 'de')),
      });
    }

    if (action === 'housenumbers' && street) {
      // Straße auswählen
      const streetResponse = await sbazvRequest(session, 'STREETCHANGED', {
        Ort: 'Königs Wusterhausen',
        Strasse: street,
      });

      const housenumbers = extractOptions(streetResponse, 'Hausnummer');

      return NextResponse.json({
        success: true,
        housenumbers,
      });
    }

    if (action === 'calendar-url' && street && housenumber) {
      // Straße auswählen
      await sbazvRequest(session, 'STREETCHANGED', {
        Ort: 'Königs Wusterhausen',
        Strasse: street,
      });

      // Hausnummer setzen und weiter klicken
      const forwardResponse = await fetch(
        'https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServlet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': session.cookies,
          },
          body: new URLSearchParams({
            SessionId: session.sessionId,
            SubmitAction: 'forward',
            InFrameMode: 'TRUE',
            Ort: 'Königs Wusterhausen',
            Strasse: street,
            Hausnummer: housenumber,
            R: 'on',
            P: 'on',
            L: 'on',
            GS: 'on',
            WB: 'on',
            ApplicationName: 'com.athos.nl.mvc.abfterm.CheckAbfuhrTermineParameterBusinessCase',
            PageName: 'Lageadresse',
          }).toString(),
        }
      );

      const resultHtml = await forwardResponse.text();

      // Suche nach der Kalender-URL im Response
      const urlMatch = resultHtml.match(/https:\/\/fahrzeuge\.sbazv\.de[^"'\s]*StandortID=\d+[^"'\s]*/);

      if (urlMatch) {
        // URL dekodieren und bereinigen
        let calendarUrl = urlMatch[0]
          .replace(/&amp;/g, '&')
          .replace(/&#38;/g, '&')
          .replace(/<[^>]*>/g, '') // Entferne HTML-Tags
          .replace(/[<>]/g, ''); // Entferne einzelne < oder >

        return NextResponse.json({
          success: true,
          calendarUrl,
          street,
          housenumber,
        });
      }

      // Versuche StandortID und AboID aus versteckten Feldern zu extrahieren
      const standortMatch = resultHtml.match(/StandortID['":\s]+['"]?(\d+)/);
      const aboMatch = resultHtml.match(/AboID['":\s]+['"]?(\d+)/);

      if (standortMatch && aboMatch) {
        const calendarUrl = `https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServiceServlet?ApplicationName=Calendar&SubmitAction=sync&StandortID=${standortMatch[1]}&AboID=${aboMatch[1]}&Fra=P;R;GS;L;WB`;

        return NextResponse.json({
          success: true,
          calendarUrl,
          street,
          housenumber,
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Konnte Kalender-URL nicht ermitteln. Bitte prüfe Straße und Hausnummer.',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Ungültige Aktion. Verwende: streets, housenumbers, oder calendar-url',
    }, { status: 400 });

  } catch (error) {
    console.error('[SBAZV Lookup] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler bei der SBAZV-Abfrage',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
