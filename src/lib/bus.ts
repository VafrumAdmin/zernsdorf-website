// VBB Bus-Daten für Zernsdorf
// Buslinien 721 und 723 bedienen Zernsdorf

export interface BusStop {
  id: string;
  name: string;
  lines: string[];
}

export interface BusLine {
  id: string;
  name: string;
  color: string;
  direction1: string;
  direction2: string;
  stops: string[];
  operator: string;
}

export interface BusDeparture {
  line: string;
  direction: string;
  time: Date;
  delay: number; // in minutes
  platform?: string;
  stop: string;
}

// Alle Haltestellen in Zernsdorf
export const ZERNSDORF_STOPS: BusStop[] = [
  { id: 'zernsdorf-zeltplatz', name: 'Zernsdorf Zeltplatz', lines: ['721'] },
  { id: 'zernsdorf-nordstr', name: 'Zernsdorf Nordstr.', lines: ['721'] },
  { id: 'zernsdorf-seekorso', name: 'Zernsdorf Seekorso', lines: ['721'] },
  { id: 'zernsdorf-an-der-lanke', name: 'Zernsdorf An Der Lanke', lines: ['721'] },
  { id: 'zernsdorf-bahnuebergang', name: 'Zernsdorf Bahnübergang', lines: ['721'] },
  { id: 'zernsdorf-friedrich-engels-str', name: 'Zernsdorf Friedrich-Engels-Str.', lines: ['721'] },
  { id: 'zernsdorf-dorfaue', name: 'Zernsdorf Dorfaue', lines: ['721', '723'] },
  { id: 'zernsdorf-strandweg', name: 'Zernsdorf Strandweg', lines: ['721'] },
  { id: 'zernsdorf-ruetgersstr', name: 'Zernsdorf Rütgersstr.', lines: ['721', '723'] },
  { id: 'zernsdorf-wustroweg', name: 'Zernsdorf Wustroweg', lines: ['721'] },
];

// Buslinien die durch Zernsdorf fahren
export const BUS_LINES: BusLine[] = [
  {
    id: '721',
    name: '721',
    color: '#0066cc',
    direction1: 'S Königs Wusterhausen Bhf',
    direction2: 'Kablow-Ziegelei Am Lankensee',
    operator: 'RVS Dahme-Spreewald',
    stops: [
      'Kablow-Ziegelei Am Lankensee',
      'Kablow-Ziegelei Brücke',
      'Zernsdorf Zeltplatz',
      'Zernsdorf Nordstr.',
      'Zernsdorf Seekorso',
      'Zernsdorf An Der Lanke',
      'Zernsdorf Bahnübergang',
      'Zernsdorf Friedrich-Engels-Str.',
      'Zernsdorf Dorfaue',
      'Zernsdorf Strandweg',
      'Zernsdorf Rütgersstr.',
      'Zernsdorf Wustroweg',
      'Neue Mühle Küchenmeisterallee',
      'Neue Mühle Erlenweg',
      'Neue Mühle Fürstenwalder Weg',
      'Königs Wusterhausen Tiergarten',
      'S Königs Wusterhausen Bhf',
    ],
  },
  {
    id: '723',
    name: '723',
    color: '#cc6600',
    direction1: 'S Königs Wusterhausen Bhf',
    direction2: 'Bindow',
    operator: 'RVS Dahme-Spreewald',
    stops: [
      'S Königs Wusterhausen Bhf',
      'Königs Wusterhausen Tiergarten',
      'Neue Mühle Fürstenwalder Weg',
      'Neue Mühle Erlenweg',
      'Neue Mühle Küchenmeisterallee',
      'Zernsdorf Rütgersstr.',
      'Zernsdorf Dorfaue',
      'Bindow',
    ],
  },
];

// Regionalbahn RB36
export const RB36_INFO = {
  name: 'RB36',
  route: 'Frankfurt (Oder) - Beeskow - Königs Wusterhausen',
  operator: 'NEB (Niederbarnimer Eisenbahn)',
  stopsInZernsdorf: ['Zernsdorf (Bhf)'],
  color: '#e30613',
};

// Fahrplan-Basis (typische Abfahrtszeiten Montag-Freitag)
// Linie 721 Richtung S Königs Wusterhausen Bhf ab Zernsdorf Dorfaue
const LINE_721_TO_KW = [
  '05:24', '05:54', '06:24', '06:54', '07:24', '07:54',
  '08:24', '08:54', '09:54', '10:54', '11:54', '12:54',
  '13:54', '14:24', '14:54', '15:24', '15:54', '16:24',
  '16:54', '17:24', '17:54', '18:24', '18:54', '19:54',
];

// Linie 721 Richtung Kablow ab Zernsdorf Dorfaue
const LINE_721_TO_KABLOW = [
  '05:39', '06:09', '06:39', '07:09', '07:39', '08:09',
  '08:39', '09:39', '10:39', '11:39', '12:39', '13:39',
  '14:09', '14:39', '15:09', '15:39', '16:09', '16:39',
  '17:09', '17:39', '18:09', '18:39', '19:09', '20:09',
];

/**
 * Generiert die nächsten Abfahrten basierend auf dem aktuellen Zeitpunkt
 */
export function getNextDepartures(
  stopId: string = 'zernsdorf-dorfaue',
  limit: number = 5
): BusDeparture[] {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const departures: BusDeparture[] = [];

  // Funktion um Abfahrten aus Zeitplan zu generieren
  const addDepartures = (
    times: string[],
    line: string,
    direction: string
  ) => {
    for (const time of times) {
      const [h, m] = time.split(':').map(Number);
      const timeMinutes = h * 60 + m;

      // Nur zukünftige Abfahrten
      if (timeMinutes > currentTimeMinutes) {
        const departureTime = new Date(now);
        departureTime.setHours(h, m, 0, 0);

        // Simuliere kleine Verspätungen (0-3 Minuten)
        const delay = Math.random() < 0.3 ? Math.floor(Math.random() * 4) : 0;

        departures.push({
          line,
          direction,
          time: departureTime,
          delay,
          stop: stopId,
        });
      }
    }
  };

  // Am Wochenende reduzierter Fahrplan (nur jede 3. Fahrt)
  const schedule721ToKW = isWeekend
    ? LINE_721_TO_KW.filter((_, i) => i % 3 === 0)
    : LINE_721_TO_KW;
  const schedule721ToKablow = isWeekend
    ? LINE_721_TO_KABLOW.filter((_, i) => i % 3 === 0)
    : LINE_721_TO_KABLOW;

  addDepartures(schedule721ToKW, '721', 'S Königs Wusterhausen Bhf');
  addDepartures(schedule721ToKablow, '721', 'Kablow-Ziegelei');

  // Sortiere nach Zeit und limitiere
  return departures
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .slice(0, limit);
}

/**
 * Formatiert Minuten bis zur Abfahrt
 */
export function formatMinutesUntil(departureTime: Date, delay: number = 0): string {
  const now = new Date();
  const actualDeparture = new Date(departureTime.getTime() + delay * 60000);
  const diffMs = actualDeparture.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 0) return 'Jetzt';
  if (diffMinutes === 1) return '1 Min';
  if (diffMinutes < 60) return `${diffMinutes} Min`;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')} h`;
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
 * Holt Live-Abfahrtsdaten von der VBB API (wenn verfügbar)
 * Fallback auf berechnete Zeiten wenn API nicht erreichbar
 */
export async function fetchLiveDepartures(
  stopId: string = 'zernsdorf-dorfaue',
  limit: number = 5
): Promise<{ departures: BusDeparture[]; isLive: boolean }> {
  // VBB HAFAS API könnte hier eingebunden werden
  // Für jetzt verwenden wir die berechneten Zeiten
  // Die VBB API benötigt einen API-Key und spezielle StopIDs

  // TODO: VBB HAFAS Integration wenn API-Key verfügbar
  // const VBB_API_URL = 'https://v6.vbb.transport.rest';
  // const stopIdMapping = {
  //   'zernsdorf-dorfaue': '900000230003',
  // };

  return {
    departures: getNextDepartures(stopId, limit),
    isLive: false,
  };
}

/**
 * Gibt Informationen über Störungen/Bauarbeiten zurück
 */
export function getServiceAlerts(): { line: string; message: string; validUntil?: Date }[] {
  // Hier könnten aktuelle Störungsmeldungen vom VBB eingebunden werden
  // Für jetzt statische Meldungen basierend auf bekannten Bauarbeiten
  const now = new Date();
  const alerts: { line: string; message: string; validUntil?: Date }[] = [];

  // Bekannte Bauarbeiten RB36 (März 2025)
  const rb36Bauarbeiten = new Date('2025-03-13');
  if (now < rb36Bauarbeiten && now > new Date('2025-03-12')) {
    alerts.push({
      line: 'RB36',
      message: 'Schienenersatzverkehr zwischen KW und Zernsdorf wegen Bauarbeiten',
      validUntil: rb36Bauarbeiten,
    });
  }

  return alerts;
}
