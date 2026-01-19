import type { WasteCollection, WasteType } from '@/types';

// ICS Parsing utilities for SBAZV waste calendar
// The SBAZV provides ICS files that can be downloaded per address

interface ICSEvent {
  uid: string;
  summary: string;
  dtstart: Date;
  dtend?: Date;
  description?: string;
  location?: string;
}

export function parseICS(icsContent: string): ICSEvent[] {
  const events: ICSEvent[] = [];
  const lines = icsContent.split(/\r?\n/);

  let currentEvent: Partial<ICSEvent> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart) {
        events.push(currentEvent as ICSEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      // Split at first colon to separate key from value
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const keyPart = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      // Extract base key (before any parameters like ;LANGUAGE=de or ;VALUE=DATE)
      const baseKey = keyPart.split(';')[0];

      switch (baseKey) {
        case 'UID':
          currentEvent.uid = value;
          break;
        case 'SUMMARY':
          // Remove trailing whitespace from summary
          currentEvent.summary = value.trim();
          break;
        case 'DTSTART':
          currentEvent.dtstart = parseICSDate(value);
          break;
        case 'DTEND':
          currentEvent.dtend = parseICSDate(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = value.replace(/\\n/g, '\n');
          break;
        case 'LOCATION':
          currentEvent.location = value.replace(/\\,/g, ',').trim();
          break;
      }
    }
  }

  return events;
}

function parseICSDate(dateStr: string): Date {
  // Format: YYYYMMDD or YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);

  if (dateStr.length === 8) {
    return new Date(year, month, day);
  }

  const hour = parseInt(dateStr.substring(9, 11), 10);
  const minute = parseInt(dateStr.substring(11, 13), 10);
  const second = parseInt(dateStr.substring(13, 15), 10);

  if (dateStr.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(year, month, day, hour, minute, second);
}

export function mapSummaryToWasteType(summary: string): WasteType | null {
  const lowerSummary = summary.toLowerCase();

  // Restmüll
  if (
    lowerSummary.includes('restmüll') ||
    lowerSummary.includes('restmuell') ||
    lowerSummary.includes('restabfall')
  ) {
    return 'restmuell';
  }

  // Papier
  if (lowerSummary.includes('papier') || lowerSummary.includes('altpapier')) {
    return 'papier';
  }

  // Gelber Sack / Gelbe Säcke
  if (
    lowerSummary.includes('gelb') ||
    lowerSummary.includes('wertstoff') ||
    lowerSummary.includes('verpackung')
  ) {
    return 'gelbesack';
  }

  // Bio
  if (lowerSummary.includes('bio') || lowerSummary.includes('biomüll')) {
    return 'bio';
  }

  // Laubsäcke
  if (lowerSummary.includes('laub') || lowerSummary.includes('grün')) {
    return 'laubsaecke';
  }

  // Weihnachtsbäume werden ignoriert (keine eigene Kategorie)
  if (lowerSummary.includes('weihnacht')) {
    return null;
  }

  return null;
}

export function icsEventsToWasteCollections(
  events: ICSEvent[],
  street?: string
): WasteCollection[] {
  const collections: WasteCollection[] = [];

  for (const event of events) {
    const type = mapSummaryToWasteType(event.summary);
    if (!type) continue;

    collections.push({
      id: event.uid,
      date: event.dtstart,
      type,
      street,
    });
  }

  return collections;
}

// Generate ICS content for calendar export
export function generateICS(collections: WasteCollection[], title: string): string {
  const wasteTypeNames: Record<WasteType, string> = {
    restmuell: 'Restmüll',
    papier: 'Papier/Altpapier',
    gelbesack: 'Gelber Sack',
    bio: 'Biotonne',
    laubsaecke: 'Laubsäcke',
  };

  const events = collections
    .map((collection) => {
      const dateStr = formatICSDate(collection.date);
      const nextDay = new Date(collection.date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = formatICSDate(nextDay);

      return `BEGIN:VEVENT
UID:${collection.id}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${nextDayStr}
SUMMARY:${wasteTypeNames[collection.type]} - Abholung
DESCRIPTION:Müllabholung ${wasteTypeNames[collection.type]}${collection.street ? ` - ${collection.street}` : ''}
END:VEVENT`;
    })
    .join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Zernsdorf Portal//Waste Calendar//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${title}
${events}
END:VCALENDAR`;
}

function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
