'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { EventList, EventCalendar } from '@/components/events';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import {
  Calendar,
  List,
  Plus,
  ExternalLink,
  Sparkles,
  Filter,
} from 'lucide-react';
import type { Event, EventCategory } from '@/types';

type ViewMode = 'calendar' | 'list';

const categoryFilters: { value: EventCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Alle', icon: '📋' },
  { value: 'festival', label: 'Feste', icon: '🎉' },
  { value: 'market', label: 'Märkte', icon: '🛒' },
  { value: 'culture', label: 'Kultur', icon: '🎭' },
  { value: 'sports', label: 'Sport', icon: '⚽' },
  { value: 'community', label: 'Gemeinde', icon: '🤝' },
  { value: 'course', label: 'Kurse', icon: '📚' },
  { value: 'workshop', label: 'Workshops', icon: '🔧' },
];

export default function EventsPage() {
  const t = useTranslations('events');
  const locale = useLocale();

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== 'all') {
          params.append('category', categoryFilter);
        }
        params.append('upcoming', 'true');
        params.append('limit', '100');

        const res = await fetch(`/api/events/public?${params.toString()}`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [categoryFilter]);

  // Find highlight event (Jubiläumsfest or first featured)
  const highlightEvent = events.find((e) => e.is_featured) || null;
  const regularEvents = highlightEvent
    ? events.filter((e) => e.id !== highlightEvent.id)
    : events;

  // Handle event click from calendar
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t('title')}</h1>
              <p className="mt-2 text-muted-foreground">{t('description')}</p>
            </div>

            {/* View Toggle & Actions */}
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('calendar') || 'Kalender'}</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    viewMode === 'list'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('list') || 'Liste'}</span>
                </button>
              </div>

              {/* Suggest Event Button */}
              <Link href={`/${locale}/suggest-event`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('suggestEvent') || 'Event vorschlagen'}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {categoryFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCategoryFilter(filter.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  categoryFilter === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Event */}
        {highlightEvent && viewMode === 'list' && (
          <section className="mb-12">
            <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-200 dark:border-purple-800 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {t('highlight') || 'Highlight'}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{highlightEvent.title}</h2>
                    <p className="text-muted-foreground mb-4">{highlightEvent.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(highlightEvent.start_date).toLocaleDateString(
                            locale === 'de' ? 'de-DE' : 'en-US',
                            { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                          )}
                        </span>
                      </div>
                      {highlightEvent.location_name && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{highlightEvent.location_name}</span>
                        </div>
                      )}
                    </div>
                    {highlightEvent.website && (
                      <a
                        href={highlightEvent.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        {t('moreInfo')}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {highlightEvent.image_url && (
                    <div className="flex items-center justify-center">
                      <img
                        src={highlightEvent.image_url}
                        alt={highlightEvent.title}
                        className="max-h-48 rounded-xl object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Content based on view mode */}
        {!isLoading && (
          <>
            {viewMode === 'calendar' ? (
              <section className="mb-12">
                <EventCalendar events={events} onEventClick={handleEventClick} />
              </section>
            ) : (
              <section className="mb-12">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t('upcoming')}
                </h2>
                <EventList events={regularEvents} />
              </section>
            )}
          </>
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="bg-background rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedEvent.image_url && (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                  <Badge variant="outline">{selectedEvent.category}</Badge>
                </div>

                {selectedEvent.description && (
                  <p className="text-muted-foreground mb-4">{selectedEvent.description}</p>
                )}

                <div className="space-y-2 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(selectedEvent.start_date).toLocaleDateString(
                        locale === 'de' ? 'de-DE' : 'en-US',
                        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                      )}
                      {selectedEvent.start_time && `, ${selectedEvent.start_time.substring(0, 5)} Uhr`}
                    </span>
                  </div>
                  {selectedEvent.location_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">📍</span>
                      <span>{selectedEvent.location_name}</span>
                    </div>
                  )}
                  {selectedEvent.organizer_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">👤</span>
                      <span>{selectedEvent.organizer_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {selectedEvent.website && (
                    <a
                      href={selectedEvent.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {t('moreInfo')}
                      </Button>
                    </a>
                  )}
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    {t('close') || 'Schließen'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* External Links */}
        <section className="pt-8 border-t border-border">
          <h3 className="font-medium mb-4">{t('moreCalendars') || 'Weitere Veranstaltungskalender'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="https://www.koenigs-wusterhausen.de/Kalender"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Stadt KW</p>
                <p className="text-sm text-muted-foreground">Veranstaltungskalender</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
            <a
              href="https://buergerhaus-zernsdorf.de"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Bürgerhaus Zernsdorf</p>
                <p className="text-sm text-muted-foreground">Programm & Termine</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
            <a
              href="https://www.dahme-spreewald.de/de/aktuelles/veranstaltungskalender/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Landkreis LDS</p>
                <p className="text-sm text-muted-foreground">Veranstaltungen</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
