'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Copy, Clock } from 'lucide-react';
import type { ExtendedOpeningHours, DaySchedule, DayKey, DayStatus, TimeRange } from '@/types/database';
import {
  DAY_LABELS,
  DAY_KEYS,
  STATUS_LABELS,
  createEmptyDaySchedule,
  createDefaultOpenSchedule,
  cloneOpeningHours,
} from '@/lib/opening-hours';

interface OpeningHoursEditorProps {
  value: ExtendedOpeningHours;
  onChange: (hours: ExtendedOpeningHours) => void;
  disabled?: boolean;
}

export function OpeningHoursEditor({ value, onChange, disabled = false }: OpeningHoursEditorProps) {
  const [copySource, setCopySource] = useState<DayKey | null>(null);

  const updateDay = useCallback(
    (day: DayKey, schedule: DaySchedule) => {
      const newHours = cloneOpeningHours(value);
      newHours[day] = schedule;
      onChange(newHours);
    },
    [value, onChange]
  );

  const applyToAllDays = useCallback(
    (sourceDay: DayKey) => {
      const source = value[sourceDay];
      if (!source) return;

      const newHours: ExtendedOpeningHours = {};
      for (const day of DAY_KEYS) {
        newHours[day] = {
          status: source.status,
          ranges: source.ranges.map(r => ({ ...r })),
        };
      }
      onChange(newHours);
      setCopySource(null);
    },
    [value, onChange]
  );

  const applyToWeekdays = useCallback(
    (sourceDay: DayKey) => {
      const source = value[sourceDay];
      if (!source) return;

      const newHours = cloneOpeningHours(value);
      const weekdays: DayKey[] = ['mo', 'di', 'mi', 'do', 'fr'];
      for (const day of weekdays) {
        newHours[day] = {
          status: source.status,
          ranges: source.ranges.map(r => ({ ...r })),
        };
      }
      onChange(newHours);
      setCopySource(null);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Öffnungszeiten
        </label>
      </div>

      <div className="space-y-2">
        {DAY_KEYS.map((day) => (
          <DayRow
            key={day}
            day={day}
            schedule={value[day] || createEmptyDaySchedule()}
            onChange={(schedule) => updateDay(day, schedule)}
            disabled={disabled}
            isCopySource={copySource === day}
            onCopyClick={() => setCopySource(copySource === day ? null : day)}
            onApplyToAll={() => applyToAllDays(day)}
            onApplyToWeekdays={() => applyToWeekdays(day)}
            showCopyActions={copySource === day}
          />
        ))}
      </div>
    </div>
  );
}

interface DayRowProps {
  day: DayKey;
  schedule: DaySchedule;
  onChange: (schedule: DaySchedule) => void;
  disabled: boolean;
  isCopySource: boolean;
  onCopyClick: () => void;
  onApplyToAll: () => void;
  onApplyToWeekdays: () => void;
  showCopyActions: boolean;
}

function DayRow({
  day,
  schedule,
  onChange,
  disabled,
  isCopySource,
  onCopyClick,
  onApplyToAll,
  onApplyToWeekdays,
  showCopyActions,
}: DayRowProps) {
  const updateStatus = (status: DayStatus) => {
    if (status === 'open' && schedule.ranges.length === 0) {
      // When switching to open, add a default time range
      onChange({
        status: 'open',
        ranges: [{ from: '09:00', to: '18:00' }],
      });
    } else {
      onChange({
        ...schedule,
        status,
        ranges: status === 'open' ? schedule.ranges : [],
      });
    }
  };

  const updateTimeRange = (index: number, field: 'from' | 'to', value: string) => {
    const newRanges = [...schedule.ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    onChange({ ...schedule, ranges: newRanges });
  };

  const addTimeRange = () => {
    if (schedule.ranges.length < 2) {
      onChange({
        ...schedule,
        ranges: [...schedule.ranges, { from: '14:00', to: '18:00' }],
      });
    }
  };

  const removeTimeRange = (index: number) => {
    const newRanges = schedule.ranges.filter((_, i) => i !== index);
    onChange({ ...schedule, ranges: newRanges });
  };

  const isFeiertag = day === 'feiertag';

  return (
    <div
      className={`rounded-lg border p-3 ${
        isCopySource ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        {/* Day Label */}
        <div className="w-20 shrink-0 pt-2">
          <span className={`text-sm font-medium ${isFeiertag ? 'text-amber-600' : 'text-slate-700'}`}>
            {DAY_LABELS[day]}
          </span>
        </div>

        {/* Status Select */}
        <div className="shrink-0">
          <select
            value={schedule.status}
            onChange={(e) => updateStatus(e.target.value as DayStatus)}
            disabled={disabled}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="open">Offen</option>
            <option value="closed">Geschlossen</option>
            <option value="holiday">Ruhetag</option>
          </select>
        </div>

        {/* Time Ranges (only show when open) */}
        {schedule.status === 'open' && (
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2">
              {schedule.ranges.map((range, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={range.from}
                    onChange={(e) => updateTimeRange(index, 'from', e.target.value)}
                    disabled={disabled}
                    className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="time"
                    value={range.to}
                    onChange={(e) => updateTimeRange(index, 'to', e.target.value)}
                    disabled={disabled}
                    className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {schedule.ranges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeRange(index)}
                      disabled={disabled}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Zeitraum entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add second time range button */}
              {schedule.ranges.length < 2 && (
                <button
                  type="button"
                  onClick={addTimeRange}
                  disabled={disabled}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Zweiten Zeitraum hinzufügen (z.B. Mittagspause)"
                >
                  <Plus className="w-3 h-3" />
                  <span>Zeitraum</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Copy button */}
        <div className="shrink-0 ml-auto">
          <button
            type="button"
            onClick={onCopyClick}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors ${
              isCopySource
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Auf andere Tage übertragen"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Copy actions */}
      {showCopyActions && (
        <div className="mt-3 pt-3 border-t border-emerald-200 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApplyToWeekdays}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Auf Mo-Fr anwenden
          </button>
          <button
            type="button"
            onClick={onApplyToAll}
            disabled={disabled}
            className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Auf alle Tage anwenden
          </button>
          <button
            type="button"
            onClick={onCopyClick}
            disabled={disabled}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
}

export default OpeningHoursEditor;
