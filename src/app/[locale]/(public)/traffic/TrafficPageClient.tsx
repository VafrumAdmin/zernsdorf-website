'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { ConstructionList } from '@/components/traffic';
import { Card, CardContent } from '@/components/ui';
import { Construction as ConstructionIcon, Clock, AlertTriangle, ExternalLink, MapPin } from 'lucide-react';
import { LiveTrafficSection } from '@/components/traffic/LiveTrafficSection';
import type { Construction } from '@/types';

// Dynamischer Import für die Karte (Client-only wegen Leaflet)
const ConstructionsMap = dynamic(
  () => import('@/components/traffic/ConstructionsMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl">
        <div className="text-slate-500">Karte wird geladen...</div>
      </div>
    ),
  }
);

interface TrafficPageClientProps {
  activeConstructions: Construction[];
  plannedConstructions: Construction[];
}

export function TrafficPageClient({ activeConstructions, plannedConstructions }: TrafficPageClientProps) {
  const t = useTranslations('traffic');
  const [selectedConstructionId, setSelectedConstructionId] = useState<string | null>(null);

  const allConstructions = [...activeConstructions, ...plannedConstructions];
  const constructionsWithCoords = allConstructions.filter(c => c.coordinates);

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>

        {/* Live Traffic Section */}
        <LiveTrafficSection />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 mt-8">
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

        {/* Constructions Map */}
        {constructionsWithCoords.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Baustellen auf der Karte
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="aspect-[16/9] md:aspect-[21/9]">
                <ConstructionsMap
                  constructions={allConstructions}
                  selectedId={selectedConstructionId}
                  onSelect={setSelectedConstructionId}
                />
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded"></span> Aktive Baustelle
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-amber-500 rounded"></span> Geplant
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-600 rounded-full"></span> Zernsdorf
                </span>
                <span className="text-slate-500 ml-auto hidden sm:inline">Klicken Sie auf eine Baustelle, um sie auf der Karte zu sehen</span>
              </div>
            </div>
          </section>
        )}

        {/* Active Constructions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t('currentConstructions')}
          </h2>
          <ConstructionList
            constructions={activeConstructions}
            selectedId={selectedConstructionId}
            onSelect={setSelectedConstructionId}
          />
        </section>

        {/* Planned Constructions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            {t('plannedConstructions')}
          </h2>
          <ConstructionList
            constructions={plannedConstructions}
            selectedId={selectedConstructionId}
            onSelect={setSelectedConstructionId}
          />
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
              <ConstructionIcon className="h-5 w-5 text-primary" />
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
              <ConstructionIcon className="h-5 w-5 text-primary" />
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
