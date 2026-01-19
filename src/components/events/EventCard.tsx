'use client';

import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { Calendar, MapPin, User, ExternalLink } from 'lucide-react';
import type { Event, EventCategory } from '@/types';

interface EventCardProps {
  event: Event;
}

const categoryConfig: Record<EventCategory, { color: string; icon: string }> = {
  festival: { color: 'bg-purple-500', icon: '🎉' },
  market: { color: 'bg-green-500', icon: '🛒' },
  culture: { color: 'bg-blue-500', icon: '🎭' },
  sports: { color: 'bg-orange-500', icon: '⚽' },
  community: { color: 'bg-pink-500', icon: '🤝' },
  politics: { color: 'bg-gray-500', icon: '🏛️' },
  other: { color: 'bg-slate-500', icon: '📌' },
};

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations('events');
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;

  const config = categoryConfig[event.category];

  const formatEventDate = () => {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : null;

    if (end && start.toDateString() !== end.toDateString()) {
      return `${format(start, 'd. MMM', { locale: dateLocale })} - ${format(end, 'd. MMM yyyy', { locale: dateLocale })}`;
    }

    return format(start, 'EEEE, d. MMMM yyyy, HH:mm', { locale: dateLocale }) + ' Uhr';
  };

  return (
    <Card hover className="overflow-hidden">
      <div className={`h-2 ${config.color}`} />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {t(`categories.${event.category}`)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatEventDate()}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
          {event.organizer && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{event.organizer}</span>
            </div>
          )}
        </div>

        {event.url && (
          <a
            href={event.url}
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
