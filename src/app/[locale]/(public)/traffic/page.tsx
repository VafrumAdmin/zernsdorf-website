import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ConstructionList } from '@/components/traffic';
import { getActiveConstructions, getPlannedConstructions } from '@/lib/traffic/mock-data';
import { Card, CardContent } from '@/components/ui';
import { Construction, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

export default async function TrafficPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TrafficPageContent />;
}

function TrafficPageContent() {
  const t = useTranslations('traffic');

  const activeConstructions = getActiveConstructions();
  const plannedConstructions = getPlannedConstructions();

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-500 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeConstructions.length}</p>
                  <p className="text-sm text-muted-foreground">{t('currentConstructions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-yellow-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plannedConstructions.length}</p>
                  <p className="text-sm text-muted-foreground">{t('plannedConstructions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Constructions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t('currentConstructions')}
          </h2>
          <ConstructionList constructions={activeConstructions} />
        </section>

        {/* Planned Constructions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            {t('plannedConstructions')}
          </h2>
          <ConstructionList constructions={plannedConstructions} />
        </section>

        {/* External Links */}
        <section className="pt-8 border-t border-border">
          <h3 className="font-medium mb-4">Weitere Informationen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://webv3-biber.vmz.services/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Construction className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Baustelleninformationssystem</p>
                <p className="text-sm text-muted-foreground">Brandenburg-Berlin</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
            <a
              href="https://www.dahme-spreewald.de/de/aktuelles/verkehrsraumeinschraenkungen-im-landkreis-dahme-spreewald/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Construction className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Verkehrseinschränkungen</p>
                <p className="text-sm text-muted-foreground">Landkreis Dahme-Spreewald</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
          </div>
        </section>

        {/* Last Updated */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          {t('lastUpdated')}: {new Date().toLocaleDateString('de-DE')}
        </p>
      </div>
    </div>
  );
}
