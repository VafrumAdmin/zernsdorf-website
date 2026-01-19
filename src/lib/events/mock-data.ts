import type { Event, EventCategory } from '@/types';

// Mock-Daten für Veranstaltungen
// In der Produktion könnten diese von verschiedenen Quellen kommen

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: '650 Jahre Zernsdorf - Jubiläumsfest',
    description:
      'Großes Dorffest zum 650-jährigen Jubiläum von Zernsdorf mit Live-Musik, Ständen lokaler Vereine, Kinderprogramm und Feuerwerk. Ein Highlight für die ganze Familie!',
    location: 'Dorfaue Zernsdorf',
    startDate: new Date('2025-07-18T14:00:00'),
    endDate: new Date('2025-07-20T22:00:00'),
    category: 'festival',
    organizer: 'Bürgerhaus Zernsdorf',
    url: 'https://buergerhaus-zernsdorf.de',
  },
  {
    id: '2',
    title: 'Osterfeuer am Lankensee',
    description:
      'Traditionelles Osterfeuer am Strand des Lankensees. Für Getränke und Bratwurst ist gesorgt. Der Heimatverein freut sich auf zahlreiche Besucher.',
    location: 'Strand Lankensee',
    startDate: new Date('2025-04-19T18:00:00'),
    category: 'community',
    organizer: 'Heimatverein Zernsdorf',
  },
  {
    id: '3',
    title: 'Frühjahrsmarkt',
    description:
      'Regionaler Markt mit frischen Produkten von lokalen Bauern, Handwerkskunst und Pflanzen für den Garten.',
    location: 'Hauptstraße Zernsdorf',
    startDate: new Date('2025-05-10T09:00:00'),
    endDate: new Date('2025-05-10T15:00:00'),
    category: 'market',
    organizer: 'Gemeinde Königs Wusterhausen',
  },
  {
    id: '4',
    title: 'Konzert: Blasorchester Königs Wusterhausen',
    description:
      'Sommerkonzert des Blasorchesters mit klassischen und modernen Stücken. Eintritt frei, Spenden willkommen.',
    location: 'Bürgerhaus Zernsdorf',
    startDate: new Date('2025-06-21T19:00:00'),
    category: 'culture',
    organizer: 'Blasorchester Königs Wusterhausen',
    url: 'https://buergerhaus-zernsdorf.de',
  },
  {
    id: '5',
    title: 'Beachvolleyball-Turnier',
    description:
      'Offenes Beachvolleyball-Turnier am Lankensee. Anmeldung für Teams (4 Personen) bis zum 1. Juli. Teilnahmegebühr: 20€ pro Team.',
    location: 'Strandbad Lankensee',
    startDate: new Date('2025-07-12T10:00:00'),
    category: 'sports',
    organizer: 'SV Zernsdorf',
  },
  {
    id: '6',
    title: 'Ortsbeiratssitzung',
    description:
      'Öffentliche Sitzung des Ortsbeirats Zernsdorf. Tagesordnung: Haushalt 2025, Spielplatzplanung, Verkehrssituation Hauptstraße.',
    location: 'Bürgerhaus Zernsdorf',
    startDate: new Date('2025-02-15T18:00:00'),
    category: 'politics',
    organizer: 'Ortsbeirat Zernsdorf',
  },
  {
    id: '7',
    title: 'Weihnachtsmarkt Zernsdorf',
    description:
      'Gemütlicher Weihnachtsmarkt mit Glühwein, Waffeln, Kunsthandwerk und Weihnachtsprogramm für Kinder.',
    location: 'Dorfaue Zernsdorf',
    startDate: new Date('2025-12-06T14:00:00'),
    endDate: new Date('2025-12-06T20:00:00'),
    category: 'market',
    organizer: 'Bürgerhaus Zernsdorf',
  },
  {
    id: '8',
    title: 'Lankensee-Schwimmen',
    description:
      'Traditionelles Freiwasserschwimmen über 1,5 km im Lankensee. Anmeldung erforderlich. Für geübte Schwimmer ab 16 Jahren.',
    location: 'Strandbad Lankensee',
    startDate: new Date('2025-08-16T09:00:00'),
    category: 'sports',
    organizer: 'DLRG Ortsgruppe Königs Wusterhausen',
  },
];

export function getUpcomingEvents(): Event[] {
  const now = new Date();
  return MOCK_EVENTS
    .filter((e) => new Date(e.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function getPastEvents(): Event[] {
  const now = new Date();
  return MOCK_EVENTS
    .filter((e) => new Date(e.startDate) < now)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function getEventsByCategory(category: EventCategory): Event[] {
  return MOCK_EVENTS.filter((e) => e.category === category);
}

export function getAllEvents(): Event[] {
  return MOCK_EVENTS;
}
