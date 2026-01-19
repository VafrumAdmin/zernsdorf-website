'use client';

import { useTranslations } from 'next-intl';
import { EventCard } from './EventCard';
import { Card, CardContent } from '@/components/ui';
import type { Event } from '@/types';
import { Calendar } from 'lucide-react';

interface EventListProps {
  events: Event[];
  emptyMessage?: string;
}

export function EventList({ events, emptyMessage }: EventListProps) {
  const t = useTranslations('events');

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage || t('noEvents')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
