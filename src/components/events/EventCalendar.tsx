'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, MapPin, User, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import type { Event, EventCategory } from '@/types';

interface EventCalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

const categoryConfig: Record<EventCategory, { color: string; bgColor: string; icon: string }> = {
  general: { color: 'bg-gray-500', bgColor: 'bg-gray-100', icon: '📅' },
  festival: { color: 'bg-purple-500', bgColor: 'bg-purple-100', icon: '🎉' },
  market: { color: 'bg-green-500', bgColor: 'bg-green-100', icon: '🛒' },
  culture: { color: 'bg-blue-500', bgColor: 'bg-blue-100', icon: '🎭' },
  sports: { color: 'bg-orange-500', bgColor: 'bg-orange-100', icon: '⚽' },
  community: { color: 'bg-pink-500', bgColor: 'bg-pink-100', icon: '🤝' },
  official: { color: 'bg-gray-600', bgColor: 'bg-gray-100', icon: '🏛️' },
  course: { color: 'bg-teal-500', bgColor: 'bg-teal-100', icon: '📚' },
  workshop: { color: 'bg-amber-500', bgColor: 'bg-amber-100', icon: '🔧' },
  other: { color: 'bg-slate-500', bgColor: 'bg-slate-100', icon: '📌' },
};

export function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const t = useTranslations('events');
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get events for a specific day
  const getEventsForDay = (day: Date): Event[] => {
    return events.filter((event) => {
      const startDate = parseISO(event.start_date);
      const endDate = event.end_date ? parseISO(event.end_date) : startDate;

      return isWithinInterval(day, { start: startDate, end: endDate }) ||
             isSameDay(day, startDate);
    });
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Format event time
  const formatEventTime = (event: Event): string => {
    if (event.is_all_day) {
      return t('allDay') || 'Ganztägig';
    }

    let timeStr = '';
    if (event.start_time) {
      timeStr = event.start_time.substring(0, 5); // HH:MM
    }
    if (event.end_time) {
      timeStr += ` - ${event.end_time.substring(0, 5)}`;
    }
    return timeStr || '';
  };

  // Weekday headers
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  aria-label={t('previousMonth') || 'Vorheriger Monat'}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  aria-label={t('nextMonth') || 'Nächster Monat'}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
              </CardTitle>

              <Button variant="outline" size="sm" onClick={goToToday}>
                {t('today') || 'Heute'}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative p-2 min-h-[60px] text-sm rounded-lg transition-colors
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}
                      ${isToday ? 'bg-primary/10 font-bold' : ''}
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                      ${hasEvents && isCurrentMonth ? 'hover:bg-accent' : 'hover:bg-muted/50'}
                    `}
                  >
                    <span className={`
                      ${isToday ? 'text-primary' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>

                    {/* Event indicators */}
                    {hasEvents && isCurrentMonth && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${categoryConfig[event.category]?.color || 'bg-gray-500'}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Selected Day Events */}
      <div className="w-full lg:w-80">
        <Card className="sticky top-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedDate
                  ? format(selectedDate, 'd. MMMM yyyy', { locale: dateLocale })
                  : t('selectDate') || 'Datum auswählen'}
              </CardTitle>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('clickOnDay') || 'Klicken Sie auf einen Tag, um Events anzuzeigen'}
              </p>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('noEventsOnDay') || 'Keine Veranstaltungen an diesem Tag'}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => {
                  const config = categoryConfig[event.category] || categoryConfig.other;
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`w-full text-left p-3 rounded-lg transition-colors hover:opacity-90 ${config.bgColor}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{event.title}</h4>

                          {formatEventTime(event) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatEventTime(event)}</span>
                            </div>
                          )}

                          {event.location_name && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{event.location_name}</span>
                            </div>
                          )}

                          {event.organizer_name && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <User className="h-3 w-3" />
                              <span className="truncate">{event.organizer_name}</span>
                            </div>
                          )}

                          {event.is_recurring && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {t('recurring') || 'Wiederkehrend'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
