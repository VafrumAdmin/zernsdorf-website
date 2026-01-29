import type {
  OpeningHours,
  ExtendedOpeningHours,
  OpeningHoursData,
  DaySchedule,
  TimeRange,
  DayKey,
  DayStatus,
} from '@/types/database';
import { isExtendedOpeningHours } from '@/types/database';

// Day labels in German
export const DAY_LABELS: Record<DayKey, string> = {
  mo: 'Montag',
  di: 'Dienstag',
  mi: 'Mittwoch',
  do: 'Donnerstag',
  fr: 'Freitag',
  sa: 'Samstag',
  so: 'Sonntag',
  feiertag: 'Feiertag',
};

// Short day labels
export const DAY_LABELS_SHORT: Record<DayKey, string> = {
  mo: 'Mo',
  di: 'Di',
  mi: 'Mi',
  do: 'Do',
  fr: 'Fr',
  sa: 'Sa',
  so: 'So',
  feiertag: 'Feiertag',
};

// Ordered list of day keys
export const DAY_KEYS: DayKey[] = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so', 'feiertag'];

// Status labels in German
export const STATUS_LABELS: Record<DayStatus, string> = {
  open: 'Offen',
  closed: 'Geschlossen',
  holiday: 'Ruhetag',
};

// Create an empty day schedule
export function createEmptyDaySchedule(): DaySchedule {
  return {
    status: 'closed',
    ranges: [],
  };
}

// Create a default open day schedule (9:00 - 18:00)
export function createDefaultOpenSchedule(): DaySchedule {
  return {
    status: 'open',
    ranges: [{ from: '09:00', to: '18:00' }],
  };
}

// Create empty extended opening hours
export function createEmptyOpeningHours(): ExtendedOpeningHours {
  return {
    mo: createEmptyDaySchedule(),
    di: createEmptyDaySchedule(),
    mi: createEmptyDaySchedule(),
    do: createEmptyDaySchedule(),
    fr: createEmptyDaySchedule(),
    sa: createEmptyDaySchedule(),
    so: createEmptyDaySchedule(),
    feiertag: createEmptyDaySchedule(),
  };
}

// Create default weekday opening hours (Mo-Fr 9-18, Sa-So closed)
export function createDefaultWeekdayHours(): ExtendedOpeningHours {
  return {
    mo: createDefaultOpenSchedule(),
    di: createDefaultOpenSchedule(),
    mi: createDefaultOpenSchedule(),
    do: createDefaultOpenSchedule(),
    fr: createDefaultOpenSchedule(),
    sa: createEmptyDaySchedule(),
    so: createEmptyDaySchedule(),
    feiertag: { status: 'holiday', ranges: [] },
  };
}

// Validate time format (HH:MM)
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

// Validate a time range
export function isValidTimeRange(range: TimeRange): boolean {
  if (!isValidTimeFormat(range.from) || !isValidTimeFormat(range.to)) {
    return false;
  }
  // Allow same time (24h), or from < to
  return range.from <= range.to || (range.from > range.to); // Allow overnight spans
}

// Format a time range to string
export function formatTimeRange(range: TimeRange): string {
  return `${range.from} - ${range.to} Uhr`;
}

// Format a day schedule to readable string
export function formatDaySchedule(schedule: DaySchedule | undefined): string {
  if (!schedule) return '-';

  switch (schedule.status) {
    case 'closed':
      return 'Geschlossen';
    case 'holiday':
      return 'Ruhetag';
    case 'open':
      if (schedule.ranges.length === 0) return 'Offen (keine Zeiten)';
      return schedule.ranges.map(formatTimeRange).join(', ');
    default:
      return '-';
  }
}

// Format extended opening hours to multiline string
export function formatExtendedOpeningHours(hours: ExtendedOpeningHours): string {
  const lines: string[] = [];

  for (const key of DAY_KEYS) {
    const schedule = hours[key];
    if (schedule) {
      lines.push(`${DAY_LABELS_SHORT[key]}: ${formatDaySchedule(schedule)}`);
    }
  }

  return lines.join('\n');
}

// Convert legacy string-based hours to extended format
export function convertLegacyToExtended(legacy: OpeningHours): ExtendedOpeningHours {
  const result: ExtendedOpeningHours = {};

  for (const key of DAY_KEYS) {
    const value = legacy[key];
    if (value) {
      // Try to parse time ranges from string like "09:00 - 18:00" or "9-18"
      const ranges = parseTimeRangesFromString(value);

      if (value.toLowerCase().includes('geschlossen')) {
        result[key] = { status: 'closed', ranges: [] };
      } else if (value.toLowerCase().includes('ruhetag')) {
        result[key] = { status: 'holiday', ranges: [] };
      } else if (ranges.length > 0) {
        result[key] = { status: 'open', ranges };
      } else {
        // Could not parse, mark as closed
        result[key] = { status: 'closed', ranges: [] };
      }
    }
  }

  return result;
}

// Parse time ranges from a string like "09:00 - 18:00, 19:00 - 22:00"
export function parseTimeRangesFromString(str: string): TimeRange[] {
  const ranges: TimeRange[] = [];

  // Match patterns like "9:00 - 18:00" or "9-18" or "09:00-18:00"
  const regex = /(\d{1,2}(?::\d{2})?)\s*[-–]\s*(\d{1,2}(?::\d{2})?)/g;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const from = normalizeTime(match[1]);
    const to = normalizeTime(match[2]);

    if (from && to) {
      ranges.push({ from, to });
    }
  }

  return ranges;
}

// Normalize time to HH:MM format
function normalizeTime(time: string): string | null {
  // Handle "9" -> "09:00"
  if (/^\d{1,2}$/.test(time)) {
    const hour = parseInt(time, 10);
    if (hour >= 0 && hour <= 23) {
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    return null;
  }

  // Handle "9:00" -> "09:00"
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  return null;
}

// Check if extended opening hours is essentially empty
export function isEmptyOpeningHours(hours: ExtendedOpeningHours | null | undefined): boolean {
  if (!hours) return true;

  return DAY_KEYS.every(key => {
    const schedule = hours[key];
    return !schedule || schedule.status === 'closed';
  });
}

// Get opening hours for display (handles both formats)
export function getOpeningHoursDisplay(
  hours: OpeningHoursData | null | undefined,
  textFallback: string | null | undefined
): string {
  if (!hours && textFallback) {
    return textFallback;
  }

  if (!hours) {
    return 'Keine Angaben';
  }

  // Check if it's the extended format
  if (isExtendedOpeningHours(hours)) {
    return formatExtendedOpeningHours(hours as ExtendedOpeningHours);
  }

  // Legacy format - just concatenate values
  const legacy = hours as OpeningHours;
  const parts: string[] = [];

  for (const key of DAY_KEYS) {
    const value = legacy[key];
    if (value) {
      parts.push(`${DAY_LABELS_SHORT[key]}: ${value}`);
    }
  }

  return parts.length > 0 ? parts.join('\n') : (textFallback || 'Keine Angaben');
}

// Clone opening hours deeply
export function cloneOpeningHours(hours: ExtendedOpeningHours): ExtendedOpeningHours {
  const result: ExtendedOpeningHours = {};

  for (const key of DAY_KEYS) {
    const schedule = hours[key];
    if (schedule) {
      result[key] = {
        status: schedule.status,
        ranges: schedule.ranges.map(r => ({ ...r })),
      };
    }
  }

  return result;
}
