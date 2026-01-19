// SBAZV Abfallkalender für Zernsdorf
// WICHTIG: Jede Adresse in Zernsdorf hat eine eigene StandortID beim SBAZV!
// Die Abholtermine sind NICHT für alle Straßen gleich.
// Nutzer müssen ihre persönliche ICS-URL vom SBAZV-Portal holen.

/**
 * Basis-URL für den SBAZV-Kalenderexport
 */
export const SBAZV_BASE_URL = 'https://fahrzeuge.sbazv.de/WasteManagementSuedbrandenburg/WasteManagementServiceServlet';

/**
 * URL zum SBAZV-Portal für die Nutzer
 */
export const SBAZV_PORTAL_URL = 'https://www.sbazv.de/online-services/abfuhrtermine/';

/**
 * Erstellt eine ICS-URL aus StandortID und AboID
 */
export function buildIcsUrl(standortId: string, aboId: string): string {
  return `${SBAZV_BASE_URL}?ApplicationName=Calendar&SubmitAction=sync&StandortID=${standortId}&AboID=${aboId}&Fra=P;R;GS;L;WB`;
}

/**
 * Extrahiert StandortID und AboID aus einer SBAZV-ICS-URL
 */
export function parseIcsUrl(url: string): { standortId: string; aboId: string } | null {
  try {
    const urlObj = new URL(url);
    const standortId = urlObj.searchParams.get('StandortID');
    const aboId = urlObj.searchParams.get('AboID');

    if (standortId && aboId) {
      return { standortId, aboId };
    }
    return null;
  } catch {
    // Versuche es mit Regex falls URL-Parsing fehlschlägt
    const standortMatch = url.match(/StandortID=(\d+)/);
    const aboMatch = url.match(/AboID=(\d+)/);

    if (standortMatch && aboMatch) {
      return { standortId: standortMatch[1], aboId: aboMatch[1] };
    }
    return null;
  }
}

/**
 * Validiert eine SBAZV-ICS-URL
 */
export function isValidSbazvUrl(url: string): boolean {
  return url.includes('fahrzeuge.sbazv.de') &&
         url.includes('StandortID=') &&
         url.includes('AboID=');
}

// Für Abwärtskompatibilität - entfernt, da jede Adresse eigene IDs hat
export function getIcsUrlForStreet(_streetName?: string): string | null {
  // DEPRECATED: Jede Adresse hat eine eigene StandortID
  // Nutzer muss seine persönliche URL vom SBAZV-Portal holen
  return null;
}

// Liste der Straßen in Zernsdorf (für Anzeige/Autovervollständigung)
export const ZERNSDORF_STREETS = [
  "Ahornallee", "Akazienallee", "Alte Trift", "Alte Werftstraße", "Am Anger",
  "Am Bahndamm", "Am Fließ", "Am Graben", "Am Krüpelsee", "Am Lankensee",
  "Am Rehgrund", "Am Schiedeholz", "Am Schmulangsberg", "Am Stujangsberg",
  "Am Wiesengrund", "Am Wukrosch", "Amselgrund", "Amselsteg", "Amselweg",
  "An der Bahn", "An der Chaussee", "An der Dahme", "An der Lanke", "An der Ziegelei",
  "Asternsteg", "Bahnhofstraße", "Bahnhofsweg", "Bebelstraße", "Bergstraße",
  "Bindowbrück", "Bindower Weg", "Birkenallee", "Birkensteg", "Birkenweg",
  "Blackbergstell", "Brunhildstraße", "Buersweg", "Chausseestraße",
  "Clara-Zetkin-Straße", "Dahliensteg", "Dannenreicher Straße", "Dannenreicher Weg",
  "Dietrichstraße", "Dorfaue", "Dorfstraße", "Drosselgrund", "Drosselweg",
  "Eckardstraße", "Eichenweg", "Einsiedelweg", "Elfensteig", "Erwin-Schulze-Straße",
  "Feldstraße", "Feldweg", "Finkengrund", "Finkenstraße", "Fischerweg",
  "Fliederweg", "Flurweg", "Fontaneallee", "Fontanestraße", "Forstallee",
  "Friedensaue", "Friedenstraße", "Friedersdorfer Straße", "Friedhofsweg",
  "Friedrich-Engels-Straße", "Friesenstraße", "Fürstenwalder Weg", "Goethestraße",
  "Gräbendorfer Straße", "Grüner Weg", "Gudrunstraße", "Gunterstraße",
  "Gussower Straße", "Gutsstraße", "Hagenstraße", "Hasensprung", "Heidestraße",
  "Heideweg", "Heinrich-Heine-Straße", "Herderstraße", "Hinterkietz", "Hochstraße",
  "Im Gehölz", "Iris-Hahs-Hoffstetter-Straße", "Jägersteig", "Jahnstraße",
  "Johann-Theimer-Straße", "Kablower Chaussee", "Kablower Straße", "Karl-Marx-Straße",
  "Karlsweg", "Kastanienweg", "Kiefernweg", "Knorrsweg", "Körbiskruger Straße",
  "Krimhildstraße", "Krüpelweg", "Landhausstraße", "Lankensteg", "Lessingstraße",
  "Libellenweg", "Lilienthalstraße", "Lindenstraße", "Lindenweg", "Luchstraße",
  "Melli-Beese-Straße", "Mittelstraße", "Mittelweg", "Mühlenweg", "Nelkensteg",
  "Neptunstraße", "Niederlehmer Straße", "Nixenweg", "Nordstraße", "Pappelallee",
  "Parkallee", "Parkpromenade", "Pirolweg", "Platanenallee", "Poseidonstraße",
  "Ringstraße", "Robinienweg", "Roseggerstraße", "Rosensteg", "Rotdornstraße",
  "Rütgersstraße", "Schillerstraße", "Schillingstraße", "Seeblickstraße",
  "Seeidyll", "Seekorso", "Seesteg", "Seestraße", "Segelfliegerdamm",
  "Senziger Weg", "Siegfriedstraße", "Sonnenweg", "Straße A", "Strandweg",
  "Talstraße", "Triftstraße", "Triftweg", "Uckley", "Uckleysteg", "Uferpromenade",
  "Ufersteg", "Uferstraße", "Undinestraße", "Unter den Eichen", "Unter den Kiefern",
  "Vorderkietz", "Wacholderweg", "Wachtelweg", "Waldallee", "Waldsiedlung",
  "Waldstraße", "Weidengrund", "Wendenstraße", "Werftstraße", "Werner-Kubitza-Straße",
  "Wernsdorfer Straße", "Wiesendamm", "Wildpfad", "Wustroweg", "Zernsdorfer Straße",
  "Ziegeleier Straße", "Zum Bahnhof", "Zum Langen Berg", "Zur Heide"
].sort((a, b) => a.localeCompare(b, 'de'));
