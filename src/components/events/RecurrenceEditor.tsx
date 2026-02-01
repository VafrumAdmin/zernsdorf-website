'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Button } from '@/components/ui';
import { Calendar, Repeat } from 'lucide-react';

interface RecurrenceEditorProps {
  value?: string; // RRULE string
  endDate?: string;
  onChange: (rrule: string | null, endDate: string | null) => void;
}

type Frequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

const WEEKDAYS: { key: Weekday; labelDe: string; labelEn: string }[] = [
  { key: 'MO', labelDe: 'Mo', labelEn: 'Mon' },
  { key: 'TU', labelDe: 'Di', labelEn: 'Tue' },
  { key: 'WE', labelDe: 'Mi', labelEn: 'Wed' },
  { key: 'TH', labelDe: 'Do', labelEn: 'Thu' },
  { key: 'FR', labelDe: 'Fr', labelEn: 'Fri' },
  { key: 'SA', labelDe: 'Sa', labelEn: 'Sat' },
  { key: 'SU', labelDe: 'So', labelEn: 'Sun' },
];

// Parse RRULE string to extract frequency and weekdays
function parseRRule(rrule: string | undefined): {
  frequency: Frequency;
  interval: number;
  weekdays: Weekday[];
} {
  if (!rrule) {
    return { frequency: 'WEEKLY', interval: 1, weekdays: [] };
  }

  const freqMatch = rrule.match(/FREQ=(\w+)/);
  const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
  const bydayMatch = rrule.match(/BYDAY=([A-Z,]+)/);

  let frequency: Frequency = 'WEEKLY';
  let interval = 1;

  if (freqMatch) {
    if (freqMatch[1] === 'MONTHLY') {
      frequency = 'MONTHLY';
    } else if (freqMatch[1] === 'WEEKLY') {
      frequency = 'WEEKLY';
    }
  }

  if (intervalMatch) {
    interval = parseInt(intervalMatch[1], 10);
    if (frequency === 'WEEKLY' && interval === 2) {
      frequency = 'BIWEEKLY';
    }
  }

  const weekdays: Weekday[] = bydayMatch
    ? (bydayMatch[1].split(',').filter((d) => WEEKDAYS.some((w) => w.key === d)) as Weekday[])
    : [];

  return { frequency, interval, weekdays };
}

// Build RRULE string from frequency and weekdays
function buildRRule(frequency: Frequency, weekdays: Weekday[]): string {
  let rrule = '';

  switch (frequency) {
    case 'WEEKLY':
      rrule = 'FREQ=WEEKLY';
      break;
    case 'BIWEEKLY':
      rrule = 'FREQ=WEEKLY;INTERVAL=2';
      break;
    case 'MONTHLY':
      rrule = 'FREQ=MONTHLY';
      break;
  }

  if (weekdays.length > 0 && frequency !== 'MONTHLY') {
    rrule += `;BYDAY=${weekdays.join(',')}`;
  }

  return rrule;
}

export function RecurrenceEditor({ value, endDate, onChange }: RecurrenceEditorProps) {
  const t = useTranslations('events');

  const parsed = parseRRule(value);
  const [frequency, setFrequency] = useState<Frequency>(parsed.frequency);
  const [weekdays, setWeekdays] = useState<Weekday[]>(parsed.weekdays);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(endDate || '');

  // Update parent when values change
  useEffect(() => {
    const rrule = buildRRule(frequency, weekdays);
    onChange(rrule, recurrenceEndDate || null);
  }, [frequency, weekdays, recurrenceEndDate, onChange]);

  // Toggle weekday selection
  const toggleWeekday = (day: Weekday) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Repeat className="h-4 w-4" />
        <span>{t('recurrence.title') || 'Wiederholung'}</span>
      </div>

      {/* Frequency selection */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('recurrence.frequency') || 'Frequenz'}
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="WEEKLY">{t('recurrence.weekly') || 'Wöchentlich'}</option>
          <option value="BIWEEKLY">{t('recurrence.biweekly') || 'Alle 2 Wochen'}</option>
          <option value="MONTHLY">{t('recurrence.monthly') || 'Monatlich'}</option>
        </select>
      </div>

      {/* Weekday selection (only for weekly/biweekly) */}
      {(frequency === 'WEEKLY' || frequency === 'BIWEEKLY') && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('recurrence.weekdays') || 'An diesen Tagen'}
          </label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <Button
                key={day.key}
                type="button"
                variant={weekdays.includes(day.key) ? 'primary' : 'outline'}
                size="sm"
                onClick={() => toggleWeekday(day.key)}
                className="w-10"
              >
                {day.labelDe}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('recurrence.weekdaysHint') || 'Wählen Sie die Tage, an denen der Kurs stattfindet'}
          </p>
        </div>
      )}

      {/* End date */}
      <div>
        <label className="block text-sm font-medium mb-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{t('recurrence.endDate') || 'Endet am'}</span>
          </div>
        </label>
        <Input
          type="date"
          value={recurrenceEndDate}
          onChange={(e) => setRecurrenceEndDate(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('recurrence.endDateHint') || 'Leer lassen für unbegrenzte Wiederholung'}
        </p>
      </div>

      {/* Preview */}
      <div className="text-sm text-muted-foreground border-t pt-3 mt-3">
        <strong>{t('recurrence.preview') || 'Vorschau'}:</strong>{' '}
        {frequency === 'WEEKLY' && weekdays.length > 0 && (
          <span>
            {t('recurrence.previewWeekly') || 'Jede Woche'} {weekdays.map((d) => WEEKDAYS.find((w) => w.key === d)?.labelDe).join(', ')}
          </span>
        )}
        {frequency === 'BIWEEKLY' && weekdays.length > 0 && (
          <span>
            {t('recurrence.previewBiweekly') || 'Alle 2 Wochen'} {weekdays.map((d) => WEEKDAYS.find((w) => w.key === d)?.labelDe).join(', ')}
          </span>
        )}
        {frequency === 'MONTHLY' && (
          <span>{t('recurrence.previewMonthly') || 'Monatlich am gleichen Tag'}</span>
        )}
        {frequency !== 'MONTHLY' && weekdays.length === 0 && (
          <span className="text-amber-600">
            {t('recurrence.selectWeekdays') || 'Bitte wählen Sie mindestens einen Tag'}
          </span>
        )}
        {recurrenceEndDate && (
          <span> {t('recurrence.until') || 'bis'} {new Date(recurrenceEndDate).toLocaleDateString('de-DE')}</span>
        )}
      </div>
    </div>
  );
}
