import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Timeline } from '@/components/history';
import { getAllHistory } from '@/lib/history/data';
import { Card, CardContent } from '@/components/ui';
import { BookOpen, Calendar, MapPin, Users } from 'lucide-react';

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HistoryPageContent />;
}

function HistoryPageContent() {
  const t = useTranslations('history');

  const historyEntries = getAllHistory();

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Intro Section */}
        <Card className="mb-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Über Zernsdorf</h2>
                <p className="text-muted-foreground mb-4">
                  Zernsdorf ist ein Ortsteil der Stadt Königs Wusterhausen im Landkreis
                  Dahme-Spreewald, südöstlich von Berlin. Der malerische Ort liegt am
                  Ufer des Zernsdorfer Lankensees und blickt auf eine über 650-jährige Geschichte
                  zurück.
                </p>
                <p className="text-muted-foreground">
                  Von den ersten slawischen Siedlern über die bewegten Jahrhunderte
                  bis zur heutigen Zeit als beliebter Wohnort - die Geschichte Zernsdorfs
                  spiegelt die Geschichte Brandenburgs wider.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                  <div className="text-2xl font-bold">1375</div>
                  <div className="text-sm text-muted-foreground">Erste Erwähnung</div>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                  <div className="text-2xl font-bold">~3.500</div>
                  <div className="text-sm text-muted-foreground">Einwohner heute</div>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <MapPin className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                  <div className="text-2xl font-bold">LDS</div>
                  <div className="text-sm text-muted-foreground">Dahme-Spreewald</div>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <BookOpen className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                  <div className="text-2xl font-bold">650</div>
                  <div className="text-sm text-muted-foreground">Jahre Geschichte</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zernsdorfer Lankensee Section */}
        <Card className="mb-12">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/3 h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
                <span className="text-6xl">🏊</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">Der Zernsdorfer Lankensee</h3>
                <p className="text-muted-foreground mb-3">
                  Der Zernsdorfer Lankensee (auch Zernsdorfer Lanke) ist das Herzstück von Zernsdorf.
                  Der See bietet hervorragende Bedingungen zum Baden, Angeln und für Wassersport.
                </p>
                <p className="text-muted-foreground">
                  Schon zu DDR-Zeiten war der See ein beliebtes Ausflugsziel für Berliner.
                  Heute ist das Strandbad am Lankensee im Sommer ein Treffpunkt für
                  Familien und Erholungssuchende aus der ganzen Region.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <section>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            {t('timeline')}
          </h2>
          <Timeline entries={historyEntries} />
        </section>

        {/* Sources */}
        <section className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Die historischen Informationen basieren auf lokalen Quellen und allgemein
            verfügbaren Geschichtsdaten. Für detailliertere Informationen empfehlen
            wir einen Besuch im Heimatmuseum Königs Wusterhausen.
          </p>
        </section>
      </div>
    </div>
  );
}
