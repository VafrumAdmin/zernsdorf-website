import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { EventList } from '@/components/events';
import { getUpcomingEvents } from '@/lib/events/mock-data';
import { Card, CardContent } from '@/components/ui';
import { Calendar, ExternalLink, Sparkles } from 'lucide-react';

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EventsPageContent />;
}

function EventsPageContent() {
  const t = useTranslations('events');

  const upcomingEvents = getUpcomingEvents();

  // Highlight für das Jubiläumsfest
  const jubilaeumEvent = upcomingEvents.find((e) => e.id === '1');
  const otherEvents = upcomingEvents.filter((e) => e.id !== '1');

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>

        {/* Highlight Event */}
        {jubilaeumEvent && (
          <section className="mb-12">
            <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-200 dark:border-purple-800 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Highlight des Jahres
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{jubilaeumEvent.title}</h2>
                    <p className="text-muted-foreground mb-4">{jubilaeumEvent.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>18. - 20. Juli 2025</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{jubilaeumEvent.location}</span>
                      </div>
                    </div>
                    {jubilaeumEvent.url && (
                      <a
                        href={jubilaeumEvent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Mehr erfahren
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center p-8 bg-white/50 dark:bg-black/20 rounded-xl">
                      <div className="text-6xl mb-2">🎉</div>
                      <div className="text-4xl font-bold text-purple-600">650</div>
                      <div className="text-lg text-muted-foreground">Jahre Zernsdorf</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('upcoming')}
          </h2>
          <EventList events={otherEvents} />
        </section>

        {/* External Links */}
        <section className="pt-8 border-t border-border">
          <h3 className="font-medium mb-4">Weitere Veranstaltungskalender</h3>
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
