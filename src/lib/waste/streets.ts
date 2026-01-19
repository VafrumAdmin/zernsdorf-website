// Straßen in Zernsdorf für die Müllabfuhr-Auswahl
// Diese Daten stammen vom SBAZV Abfuhrkalender

export const ZERNSDORF_STREETS = [
  'Am Fuchsbau',
  'Am Lankensee',
  'Am Mühlenberg',
  'Am Pätzer See',
  'Am Sportplatz',
  'Am Weinberg',
  'Amselweg',
  'Birkenallee',
  'Blumenweg',
  'Buchenweg',
  'Dorfaue',
  'Dorfstraße',
  'Eichenweg',
  'Erlenweg',
  'Fischerweg',
  'Forstweg',
  'Friedenstraße',
  'Gartenstraße',
  'Hauptstraße',
  'Jahnstraße',
  'Karl-Marx-Straße',
  'Kiefernweg',
  'Kirchstraße',
  'Krumme Straße',
  'Kurze Straße',
  'Lindenstraße',
  'Mühlenweg',
  'Neue Straße',
  'Parkstraße',
  'Ringstraße',
  'Rosenweg',
  'Seestraße',
  'Siedlungsweg',
  'Sonnenweg',
  'Strandpromenade',
  'Tannenweg',
  'Uferstraße',
  'Waldstraße',
  'Wiesenweg',
].sort();

export function getStreetOptions() {
  return ZERNSDORF_STREETS.map((street) => ({
    value: street,
    label: street,
  }));
}
