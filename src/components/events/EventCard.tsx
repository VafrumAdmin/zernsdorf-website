'use client';

import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { Calendar, MapPin, User, ExternalLink, Repeat } from 'lucide-react';
import type { Event, EventCategory } from '@/types';

interface EventCardProps {
  event: Event;
}

const categoryConfig: Record<EventCategory, { color: string; icon: string }> = {
  general: { color: 'bg-gray-500', icon: '📅' },
  festival: { color: 'bg-purple-500', icon: '🎉' },
  market: { color: 'bg-green-500', icon: '🛒' },
  culture: { color: 'bg-blue-500', icon: '🎭' },
  sports: { color: 'bg-orange-500', icon: '⚽' },
  community: { color: 'bg-pink-500', icon: '🤝' },
  official: { color: 'bg-gray-600', icon: '🏛️' },
  course: { color: 'bg-teal-500', icon: '📚' },
  workshop: { color: 'bg-amber-500', icon: '🔧' },
  other: { color: 'bg-slate-500', icon: '📌' },
};

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations('events');
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;

  const config = categoryConfig[event.category] || categoryConfig.other;

  const formatEventDate = () => {
    // Handle both snake_case (database) and camelCase (mock) field names
    const startDateStr = event.start_date || (event as unknown as { startDate: string }).startDate;
    const endDateStr = event.end_date || (event as unknown as { endDate: string }).endDate;
    const startTimeStr = event.start_time || (event as unknown as { startTime: string }).startTime;

    if (!startDateStr) return '';

    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : null;

    if (end && start.toDateString() !== end.toDateString()) {
      return `${format(start, 'd. MMM', { locale: dateLocale })} - ${format(end, 'd. MMM yyyy', { locale: dateLocale })}`;
    }

    if (event.is_all_day) {
      return format(start, 'EEEE, d. MMMM yyyy', { locale: dateLocale });
    }

    if (startTimeStr) {
      const timeStr = startTimeStr.substring(0, 5);
      return format(start, 'EEEE, d. MMMM yyyy', { locale: dateLocale }) + `, ${timeStr} Uhr`;
    }

    return format(start, 'EEEE, d. MMMM yyyy', { locale: dateLocale });
  };

  // Handle both snake_case and camelCase field names
  const locationName = event.location_name || (event as unknown as { location: string }).location;
  const organizerName = event.organizer_name || (event as unknown as { organizer: string }).organizer;
  const websiteUrl = event.website || (event as unknown as { url: string }).url;

  return (
    <Card hover className="overflow-hidden">
      <div className={`h-2 ${config.color}`} />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {t(`categories.${event.category}`)}
                </Badge>
                {event.is_recurring && (
                  <Badge variant="secondary" className="gap-1">
                    <Repeat className="h-3 w-3" />
                    {t('recurring') || 'Wiederkehrend'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatEventDate()}</span>
          </div>
          {locationName && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{locationName}</span>
            </div>
          )}
          {organizerName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{organizerName}</span>
            </div>
          )}
        </div>

        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            {t('moreInfo')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
