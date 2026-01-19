import type { Construction } from '@/types';

// Mock data für Baustellen in der Region
// In der Produktion würden diese Daten vom Baustelleninformationssystem Brandenburg kommen

export const MOCK_CONSTRUCTIONS: Construction[] = [
  {
    id: '1',
    title: 'Sanierung der Hauptstraße',
    description:
      'Vollständige Erneuerung der Fahrbahndecke inkl. Gehwege. Die Straße ist während der Bauarbeiten halbseitig gesperrt. Eine Ampelregelung ist eingerichtet.',
    location: 'Hauptstraße, Zernsdorf',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-03-30'),
    status: 'active',
    source: 'Landesbetrieb Straßenwesen Brandenburg',
    coordinates: { lat: 52.2847, lng: 13.6083 },
  },
  {
    id: '2',
    title: 'Brückenbauarbeiten L40',
    description:
      'Sanierung der Brücke über den Nottekanal. Einspurige Verkehrsführung mit Ampelregelung. Erhöhte Staugefahr zu Stoßzeiten.',
    location: 'L40 bei Königs Wusterhausen',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-08-15'),
    status: 'active',
    source: 'Landesbetrieb Straßenwesen Brandenburg',
    coordinates: { lat: 52.2956, lng: 13.6312 },
  },
  {
    id: '3',
    title: 'Kanalbauarbeiten Seestraße',
    description:
      'Verlegung neuer Abwasserkanäle. Die Seestraße ist im betroffenen Abschnitt für den Durchgangsverkehr gesperrt. Anlieger können ihre Grundstücke erreichen.',
    location: 'Seestraße, Zernsdorf',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-05-15'),
    status: 'planned',
    source: 'Gemeinde Königs Wusterhausen',
    coordinates: { lat: 52.2812, lng: 13.6021 },
  },
  {
    id: '4',
    title: 'Glasfaserausbau Zernsdorf-Süd',
    description:
      'Im Zuge des Glasfaserausbaus werden in verschiedenen Straßen Arbeiten durchgeführt. Kurzzeitige Einschränkungen möglich.',
    location: 'Diverses, Zernsdorf Süd',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-09-30'),
    status: 'planned',
    source: 'Deutsche Glasfaser',
    coordinates: { lat: 52.2789, lng: 13.6045 },
  },
  {
    id: '5',
    title: 'Radweg A10 Anschlussstelle',
    description:
      'Neubau eines Radweges entlang der Zufahrt zur A10. Keine Auswirkungen auf den Kfz-Verkehr.',
    location: 'A10 Anschlussstelle Königs Wusterhausen',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-01-10'),
    status: 'completed',
    source: 'Autobahn GmbH',
    coordinates: { lat: 52.3012, lng: 13.5987 },
  },
];

export function getActiveConstructions(): Construction[] {
  return MOCK_CONSTRUCTIONS.filter((c) => c.status === 'active');
}

export function getPlannedConstructions(): Construction[] {
  return MOCK_CONSTRUCTIONS.filter((c) => c.status === 'planned');
}

export function getCompletedConstructions(): Construction[] {
  return MOCK_CONSTRUCTIONS.filter((c) => c.status === 'completed');
}

export function getAllConstructions(): Construction[] {
  return MOCK_CONSTRUCTIONS;
}
