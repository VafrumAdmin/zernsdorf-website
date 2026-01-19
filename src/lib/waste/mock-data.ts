import type { WasteCollection, WasteType } from '@/types';

// Mock data für die Entwicklung
// In der Produktion werden diese Daten vom SBAZV ICS-Feed geladen

// Hilfsfunktion: Findet den nächsten Werktag (Mo-Fr)
function getNextWeekday(date: Date, preferredDay: number): Date {
  // preferredDay: 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr
  const result = new Date(date);
  const currentDay = result.getDay(); // 0=So, 1=Mo, ...

  // Wenn Samstag (6) oder Sonntag (0), zum nächsten Montag
  if (currentDay === 0) {
    result.setDate(result.getDate() + 1);
  } else if (currentDay === 6) {
    result.setDate(result.getDate() + 2);
  }

  return result;
}

// Hilfsfunktion: Prüft ob Werktag
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

// Hilfsfunktion: Zum nächsten spezifischen Wochentag springen
function getNextSpecificWeekday(startDate: Date, targetDay: number): Date {
  // targetDay: 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr
  const result = new Date(startDate);
  const currentDay = result.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

function generateMockCollections(): WasteCollection[] {
  const collections: WasteCollection[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Restmüll: alle 2 Wochen am Dienstag
  let restmuellDate = getNextSpecificWeekday(today, 2); // Dienstag
  for (let i = 0; i < 12; i++) {
    collections.push({
      id: `restmuell-${i}`,
      date: new Date(restmuellDate),
      type: 'restmuell',
    });
    restmuellDate.setDate(restmuellDate.getDate() + 14);
  }

  // Papier: alle 4 Wochen am Mittwoch
  let papierDate = getNextSpecificWeekday(today, 3); // Mittwoch
  papierDate.setDate(papierDate.getDate() + 7); // Eine Woche später starten
  for (let i = 0; i < 6; i++) {
    collections.push({
      id: `papier-${i}`,
      date: new Date(papierDate),
      type: 'papier',
    });
    papierDate.setDate(papierDate.getDate() + 28);
  }

  // Gelber Sack: alle 2 Wochen am Donnerstag
  let gelbDate = getNextSpecificWeekday(today, 4); // Donnerstag
  for (let i = 0; i < 12; i++) {
    collections.push({
      id: `gelbesack-${i}`,
      date: new Date(gelbDate),
      type: 'gelbesack',
    });
    gelbDate.setDate(gelbDate.getDate() + 14);
  }

  // Bio: jede Woche am Freitag (nur April - Oktober)
  const month = today.getMonth();
  if (month >= 3 && month <= 9) {
    let bioDate = getNextSpecificWeekday(today, 5); // Freitag
    for (let i = 0; i < 12; i++) {
      collections.push({
        id: `bio-${i}`,
        date: new Date(bioDate),
        type: 'bio',
      });
      bioDate.setDate(bioDate.getDate() + 7);
    }
  }

  // Laubsäcke: alle 2 Wochen am Montag (nur Oktober - November)
  if (month >= 9 && month <= 10) {
    let laubDate = getNextSpecificWeekday(today, 1); // Montag
    for (let i = 0; i < 4; i++) {
      collections.push({
        id: `laubsaecke-${i}`,
        date: new Date(laubDate),
        type: 'laubsaecke',
      });
      laubDate.setDate(laubDate.getDate() + 14);
    }
  }

  return collections.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const MOCK_COLLECTIONS = generateMockCollections();

export function getMockCollectionsForStreet(street: string): WasteCollection[] {
  return MOCK_COLLECTIONS.map((c) => ({ ...c, street }));
}

export function getNextCollection(
  collections: WasteCollection[],
  type?: WasteType
): WasteCollection | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = type ? collections.filter((c) => c.type === type) : collections;

  return (
    filtered.find((c) => {
      const collectionDate = new Date(c.date);
      collectionDate.setHours(0, 0, 0, 0);
      return collectionDate >= now;
    }) || null
  );
}

export function getUpcomingCollections(
  collections: WasteCollection[],
  days: number = 14
): WasteCollection[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);

  return collections.filter((c) => {
    const collectionDate = new Date(c.date);
    collectionDate.setHours(0, 0, 0, 0);
    return collectionDate >= now && collectionDate <= endDate;
  });
}
