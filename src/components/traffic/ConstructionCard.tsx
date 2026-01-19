'use client';

import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import type { Construction } from '@/types';

interface ConstructionCardProps {
  construction: Construction;
}

export function ConstructionCard({ construction }: ConstructionCardProps) {
  const t = useTranslations('traffic');
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;

  const statusVariant = {
    planned: 'warning' as const,
    active: 'destructive' as const,
    completed: 'success' as const,
  };

  return (
    <Card>
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
              {t('from')}: {format(new Date(construction.startDate), 'dd.MM.yyyy', { locale: dateLocale })}
            </span>
          </div>
          {construction.endDate && (
            <div className="flex items-center gap-2">
              <span>
                {t('until')}: {format(new Date(construction.endDate), 'dd.MM.yyyy', { locale: dateLocale })}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {t('source')}: {construction.source}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
