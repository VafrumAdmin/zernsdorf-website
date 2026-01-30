'use client';

import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { MapPin, Calendar, ExternalLink, Info, Map } from 'lucide-react';
import type { Construction } from '@/types';

interface ConstructionCardProps {
  construction: Construction;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ConstructionCard({ construction, isSelected, onSelect }: ConstructionCardProps) {
  const t = useTranslations('traffic');
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;

  const statusVariant = {
    planned: 'warning' as const,
    active: 'destructive' as const,
    completed: 'success' as const,
    cancelled: 'secondary' as const,
  };

  const hasCoordinates = !!construction.coordinates;

  return (
    <Card
      className={`transition-all ${
        onSelect ? 'cursor-pointer hover:shadow-md' : ''
      } ${
        isSelected ? 'ring-2 ring-primary shadow-md' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">{construction.title}</CardTitle>
          <Badge variant={statusVariant[construction.status]}>
            {t(`status.${construction.status}`)}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {construction.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{construction.description}</p>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {construction.status === 'planned' ? 'Voraussichtlich ab' : t('from')}: {format(new Date(construction.startDate), 'dd.MM.yyyy', { locale: dateLocale })}
            </span>
          </div>
          {construction.endDate && (
            <div className="flex items-center gap-2">
              <span>
                {construction.status === 'planned' ? 'bis ca.' : t('until')}: {format(new Date(construction.endDate), 'dd.MM.yyyy', { locale: dateLocale })}
              </span>
            </div>
          )}
        </div>

        {construction.status === 'planned' && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-md text-xs text-yellow-800 dark:text-yellow-200">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Geplante Maßnahme - Termine sind vorläufig und werden bei Bekanntgabe aktualisiert.</span>
          </div>
        )}

        <div className="pt-2 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t('source')}:{' '}
            {construction.sourceUrl ? (
              <a
                href={construction.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {construction.source}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              construction.source
            )}
          </p>
          {onSelect && hasCoordinates && (
            <span className={`text-xs flex items-center gap-1 ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              <Map className="h-3 w-3" />
              {isSelected ? 'Auf Karte markiert' : 'Auf Karte zeigen'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
